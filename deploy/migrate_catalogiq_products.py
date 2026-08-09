# -*- coding: utf-8 -*-
"""
CatalogIQ local NormalizedProducts → local EcomDb Products aktarımı.
Sadece migration_log_local'de kaydı olmayan ürünler aktarılır.
"""
import sys, re, uuid, time
from datetime import datetime, timezone
import psycopg2
import psycopg2.extras

sys.stdout.reconfigure(encoding='utf-8')

CIQ_DSN  = "host=127.0.0.1 port=5436 dbname=catalogiq user=catalogiq password=catalogiq123"
ECOM_DSN = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"

BATCH_SIZE = 2000
NOW = datetime.now(timezone.utc)

# ------------------------------------------------------------------ #
# 1. Ön hazırlık — EcomDb Brands ve Categories bellekte
# ------------------------------------------------------------------ #
ecom = psycopg2.connect(ECOM_DSN)
cur = ecom.cursor()

# Brands: name.lower() → Id
cur.execute('SELECT "Id", "Name" FROM "Brands" WHERE "IsDeleted"=false')
brand_map = {r[1].strip().lower(): str(r[0]) for r in cur.fetchall()}
print(f"Brands yüklendi: {len(brand_map):,}")

# Categories: name.lower() → Id (sadece Otomotiv alt ve root)
cur.execute('SELECT "Id", "Name" FROM "Categories" WHERE "IsDeleted"=false')
cat_map = {r[1].strip().lower(): str(r[0]) for r in cur.fetchall()}
OTOMOTIV_ID = cat_map.get('otomotiv', '')
print(f"Categories yüklendi: {len(cat_map):,}")

# ExternalSource: CatalogIQ için kayıt bul/oluştur
CATALOGIQ_SRC_NAME = "CatalogIQ Local Sync"
cur.execute('SELECT "Id" FROM "ExternalSources" WHERE "Name"=%s AND "IsDeleted"=false', (CATALOGIQ_SRC_NAME,))
row = cur.fetchone()
if row:
    SRC_ID = str(row[0])
else:
    SRC_ID = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO "ExternalSources"
            ("Id","Name","Type","Description","IsActive","LastFetchedAt","LastFetchedCount",
             "FetchSchedule","CreatedDate","UpdatedDate","IsDeleted")
        VALUES (%s,%s,'CatalogIQ','CatalogIQ local veritabanindan normalize urun aktarimi',true,%s,0,'None',%s,%s,false)
    """, (SRC_ID, CATALOGIQ_SRC_NAME, NOW, NOW, NOW))
    ecom.commit()
print(f"ExternalSource ID: {SRC_ID}")

# Tüm mevcut SKU'lar (IX_Products_SKU GLOBAL unique)
cur.execute('SELECT "SKU" FROM "Products" WHERE "SKU" IS NOT NULL')
existing_skus = {r[0] for r in cur.fetchall()}
print(f"Mevcut SKU sayisi (global): {len(existing_skus):,}")

# Tüm mevcut Slug'lar (IX_Products_Slug GLOBAL unique)
cur.execute('SELECT "Slug" FROM "Products" WHERE "Slug" IS NOT NULL')
existing_slugs = {r[0] for r in cur.fetchall()}
print(f"Mevcut Slug sayisi (global): {len(existing_slugs):,}")

cur.close()

# ------------------------------------------------------------------ #
# 2. Yardımcılar
# ------------------------------------------------------------------ #

def slugify(text):
    if not text:
        return str(uuid.uuid4())[:8]
    text = text.lower().strip()
    text = re.sub(r'[ğ]', 'g', text)
    text = re.sub(r'[ü]', 'u', text)
    text = re.sub(r'[ş]', 's', text)
    text = re.sub(r'[ı]', 'i', text)
    text = re.sub(r'[ö]', 'o', text)
    text = re.sub(r'[ç]', 'c', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s]+', '-', text)
    text = re.sub(r'-+', '-', text).strip('-')
    return text[:200] or str(uuid.uuid4())[:8]

def resolve_category(path):
    if not path:
        return OTOMOTIV_ID
    parts = [p.strip() for p in path.split('>')]
    # En spesifik → en genel sırasıyla ara
    for part in reversed(parts):
        cid = cat_map.get(part.lower())
        if cid:
            return cid
    return OTOMOTIV_ID

def resolve_brand(name):
    if not name:
        return None
    return brand_map.get(name.strip().lower())

def make_product_row(np_row, np_cols=None):
    r = np_row  # zaten dict (RealDictCursor)
    name = (r.get('Title') or '').strip()
    if not name:
        return None

    # SKU: global unique — çakışıyorsa NULL bırak (farklı kaynak, aynı parça)
    raw_sku = r.get('Sku') or None
    if raw_sku:
        raw_sku = str(raw_sku)[:100]
    sku = raw_sku if (raw_sku and raw_sku not in existing_skus) else None

    product_id = str(uuid.uuid4())

    # Slug: global unique — çakışıyorsa suffix ekle
    slug_base = (r.get('Slug') or slugify(name))[:280]
    slug = slug_base
    if slug in existing_slugs:
        slug = f"{slug_base[:270]}-{product_id[:6]}"
    existing_slugs.add(slug)  # yeni batch çakışmasını önle

    price = r.get('PriceCurrent') or 0
    if price is None or price < 0:
        price = 0

    discount = r.get('PriceOld') or None
    # PriceOld bazen indirimli fiyat değil orijinal fiyattır, skip if > price
    if discount and price and float(discount) >= float(price):
        discount = None

    return (
        product_id,                          # Id
        name[:300],                          # Name (max 300)
        slug,                                # Slug
        r.get('LongDescription'),            # Description
        r.get('ShortDescription'),           # ShortDescription
        sku,                                 # SKU
        r.get('Barcode'),                    # Barcode
        1,                                   # ProductType (Physical)
        resolve_brand(r.get('Brand')),       # BrandId
        resolve_category(r.get('CategoryPath')),  # CategoryId
        price,                               # Price
        discount,                            # DiscountPrice
        r.get('Currency') or 'TRY',         # Currency
        20,                                  # TaxRate
        True,                                # IsActive
        True,                                # IsPublished
        False,                               # IsFeatured
        r.get('MetaTitle'),                  # MetaTitle
        r.get('MetaDescription'),            # MetaDescription
        None, None, None, None, None,        # Icon, StylesJson, VideoUrl, OemPartNumber, Chassis
        None,                                # VehicleModel
        SRC_ID,                              # ImportedFromSourceId
        None,                                # CreatedByAdminId
        NOW,                                 # CreatedDate
        None,                                # UpdatedDate
        False,                               # IsDeleted
        'catalogiq',                         # DataSource
        str(r['Id']),                        # _np_id (migration log için, son alan)
    )

# ------------------------------------------------------------------ #
# 3. Aktarım
# ------------------------------------------------------------------ #
ciq_read  = psycopg2.connect(CIQ_DSN)   # sadece okuma (named cursor)
ciq_write = psycopg2.connect(CIQ_DSN)   # migration_log_local yazma
# Server-side cursor (named) — memory için; RealDictCursor ile satırlar dict gibi
cur_ciq = ciq_read.cursor('ciq_scroll', cursor_factory=psycopg2.extras.RealDictCursor)

cur_ciq.execute("""
    SELECT np.*
    FROM "NormalizedProducts" np
    LEFT JOIN migration_log_local ml ON ml.normalized_product_id = np."Id"
    WHERE np."IsDeleted" = false
      AND ml.normalized_product_id IS NULL
    ORDER BY np."CreatedAt"
""")
# description sunucu tarafı imleçte fetchmany sonrası geliyor — dict cursor ile gerek yok
col_names = None  # artık kullanılmıyor, dict erişim kullanıyoruz

INSERT_PRODUCT = """
    INSERT INTO "Products"
        ("Id","Name","Slug","Description","ShortDescription","SKU","Barcode",
         "ProductType","BrandId","CategoryId","Price","DiscountPrice","Currency",
         "TaxRate","IsActive","IsPublished","IsFeatured","MetaTitle","MetaDescription",
         "Icon","StylesJson","VideoUrl","OemPartNumber","Chassis","VehicleModel",
         "ImportedFromSourceId","CreatedByAdminId","CreatedDate","UpdatedDate",
         "IsDeleted","DataSource")
    VALUES %s
    ON CONFLICT DO NOTHING
"""

INSERT_MIGRATION_LOG = """
    INSERT INTO migration_log_local
        (normalized_product_id, ecom_product_id, ecom_sku, action, migrated_at, updated_at)
    VALUES %s
    ON CONFLICT DO NOTHING
"""

total_inserted = 0
total_skipped = 0
batch_num = 0
t_start = time.time()

print(f"\nAktarim basliyor... (batch boyutu: {BATCH_SIZE:,})")
print("-" * 60)

while True:
    rows = cur_ciq.fetchmany(BATCH_SIZE)
    if not rows:
        break

    batch_num += 1
    product_rows = []
    migration_rows = []

    for row in rows:
        mapped = make_product_row(row)
        if mapped is None:
            total_skipped += 1
            continue

        np_id = mapped[-1]  # Son alan: NormalizedProduct.Id
        product_tuple = mapped[:-1]  # Geri kalanı Products kolonları

        product_rows.append(product_tuple)

        if mapped[5]:  # SKU varsa set'e ekle (sonraki batch'lerde çakışma olmasın)
            existing_skus.add(mapped[5])
        # Slug zaten make_product_row içinde existing_slugs'a ekleniyor

        migration_rows.append((
            np_id,           # normalized_product_id
            mapped[0],       # ecom_product_id
            mapped[5],       # ecom_sku
            'insert',
            NOW,
            NOW,
        ))

    if not product_rows:
        continue

    cur_ecom = ecom.cursor()
    psycopg2.extras.execute_values(cur_ecom, INSERT_PRODUCT, product_rows)
    inserted_this_batch = cur_ecom.rowcount

    # Migration log — CatalogIQ DB'ye ayrı bağlantıyla yaz
    cur_ciq2 = ciq_write.cursor()
    psycopg2.extras.execute_values(cur_ciq2, INSERT_MIGRATION_LOG, migration_rows)
    cur_ciq2.close()

    ecom.commit()
    ciq_write.commit()
    cur_ecom.close()

    total_inserted += inserted_this_batch
    elapsed = time.time() - t_start
    rate = total_inserted / elapsed if elapsed > 0 else 0
    print(f"  Batch {batch_num:4d}: +{inserted_this_batch:,} eklendi | toplam={total_inserted:,} | {rate:.0f}/s")

cur_ciq.close()
ciq_read.close()
ciq_write.close()

# ------------------------------------------------------------------ #
# 4. ExternalSourceImportLog
# ------------------------------------------------------------------ #
cur_final = ecom.cursor()
log_id = str(uuid.uuid4())
cur_final.execute("""
    INSERT INTO "ExternalSourceImportLogs"
        ("Id","ExternalSourceId","TargetEntity","InsertedCount","UpdatedCount",
         "SkippedCount","TotalRows","ConflictStrategy","ImportedByUserId",
         "DeletedCount","RestoredCount","CreatedDate","IsDeleted")
    VALUES (%s,%s,'Product',%s,0,%s,%s,'skip',%s,0,0,%s,false)
""", (
    log_id, SRC_ID,
    total_inserted, total_skipped, total_inserted + total_skipped,
    "eee22bd1-1a20-4c05-8726-b27fbe085641",
    NOW
))
ecom.commit()
cur_final.close()
ecom.close()

elapsed = time.time() - t_start
print("\n" + "=" * 60)
print("AKTARIM TAMAMLANDI")
print("=" * 60)
print(f"  Eklenen      : {total_inserted:,}")
print(f"  Atlanan      : {total_skipped:,}")
print(f"  Süre         : {elapsed:.0f}s ({elapsed/60:.1f}dk)")
print(f"  Hız          : {total_inserted/elapsed:.0f} ürün/s")
print("=" * 60)
