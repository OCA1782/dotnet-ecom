# -*- coding: utf-8 -*-
"""
CatalogIQ local ProductMediaAssets → local EcomDb ProductImages aktarımı.

Yalnızca:
  - migration_log_local'de action='insert' olan ürünlerin resimleri (Phase 1 ile eklenen ürünler)
  - EcomDb'de henüz ProductImages kaydı olmayan ürünler (tekrar çalıştırma güvenliği)
  - IsDeleted=false ve SourceUrl dolu olanlar
"""
import sys, uuid, time
from datetime import datetime, timezone
import psycopg2
import psycopg2.extras

sys.stdout.reconfigure(encoding='utf-8')

CIQ_DSN  = "host=127.0.0.1 port=5436 dbname=catalogiq user=catalogiq password=catalogiq123"
ECOM_DSN = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"

BATCH_SIZE = 3000
NOW = datetime.now(timezone.utc)

# ------------------------------------------------------------------ #
# 1. EcomDb: zaten ProductImages olan ürün ID'lerini yükle (tekrar
#    çalıştırma güvenliği: bunları atlıyoruz)
# ------------------------------------------------------------------ #
ecom = psycopg2.connect(ECOM_DSN)
cur_ecom = ecom.cursor()

print("EcomDb hazırlık...")
cur_ecom.execute("""
    SELECT DISTINCT "ProductId"::text
    FROM "ProductImages"
    WHERE "IsDeleted"=false AND "DataSource"='catalogiq'
""")
already_migrated = {r[0] for r in cur_ecom.fetchall()}
print(f"  Zaten aktarılmış ürün (resim var): {len(already_migrated):,}")

cur_ecom.close()

# ------------------------------------------------------------------ #
# 2. CatalogIQ: migration_log_local'de 'insert' kayıtlı ürünlerin
#    resimlerini server-side cursor ile oku
# ------------------------------------------------------------------ #
ciq_read  = psycopg2.connect(CIQ_DSN)
ciq_write = psycopg2.connect(CIQ_DSN)  # migration_log güncelleme için ayrı bağlantı

cur_ciq = ciq_read.cursor('ciq_img_scroll', cursor_factory=psycopg2.extras.RealDictCursor)
cur_ciq.execute("""
    SELECT
        pma."Id"                  AS media_id,
        ml.ecom_product_id        AS product_id,
        pma."SourceUrl"           AS image_url,
        pma."SortOrder"           AS sort_order,
        pma."CreatedAt"           AS created_at
    FROM "ProductMediaAssets" pma
    INNER JOIN migration_log_local ml
           ON ml.normalized_product_id = pma."NormalizedProductId"
          AND ml.action = 'insert'
    WHERE pma."IsDeleted" = false
      AND pma."SourceUrl" IS NOT NULL
      AND pma."SourceUrl" != ''
    ORDER BY ml.ecom_product_id, pma."SortOrder"
""")

INSERT_IMAGES = """
    INSERT INTO "ProductImages"
        ("Id","ProductId","ImageUrl","SortOrder","IsMain",
         "AltText","CreatedDate","UpdatedDate","IsDeleted","DataSource")
    VALUES %s
    ON CONFLICT DO NOTHING
"""

total_inserted = 0
total_skipped  = 0
batch_num      = 0
t_start        = time.time()

print(f"\nAktarım başlıyor... (batch boyutu: {BATCH_SIZE:,})")
print("-" * 60)

while True:
    rows = cur_ciq.fetchmany(BATCH_SIZE)
    if not rows:
        break

    batch_num += 1
    image_rows = []

    for r in rows:
        product_id = str(r['product_id'])

        # Zaten bu ürün için resim aktarılmışsa atla
        if product_id in already_migrated:
            total_skipped += 1
            continue

        sort_order = r['sort_order'] or 0
        is_main    = (sort_order == 0)
        img_id     = str(uuid.uuid4())
        created    = r['created_at'] or NOW

        image_rows.append((
            img_id,           # Id
            product_id,       # ProductId
            r['image_url'],   # ImageUrl
            sort_order,       # SortOrder
            is_main,          # IsMain
            None,             # AltText
            created,          # CreatedDate
            None,             # UpdatedDate
            False,            # IsDeleted
            'catalogiq',      # DataSource
        ))

    if not image_rows:
        continue

    cur_ins = ecom.cursor()
    psycopg2.extras.execute_values(cur_ins, INSERT_IMAGES, image_rows, page_size=BATCH_SIZE)
    cur_ins.close()
    ecom.commit()

    total_inserted += len(image_rows)
    elapsed = time.time() - t_start
    rate = total_inserted / elapsed if elapsed > 0 else 0
    print(f"  Batch {batch_num:4d}: +{len(image_rows):,} | "
          f"toplam={total_inserted:,} | {rate:.0f}/s")

cur_ciq.close()
ciq_read.close()
ciq_write.close()
ecom.close()

elapsed = time.time() - t_start
print("\n" + "=" * 60)
print("AKTARIM TAMAMLANDI")
print("=" * 60)
print(f"  Eklenen      : {total_inserted:,}")
print(f"  Atlanan      : {total_skipped:,}")
print(f"  Süre         : {elapsed:.0f}s ({elapsed/60:.1f}dk)")
if elapsed > 0:
    print(f"  Hız          : {total_inserted/elapsed:.0f} resim/s")
print("=" * 60)
