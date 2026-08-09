# -*- coding: utf-8 -*-
"""
Local EcomDb → BulutX Server EcomDb sync.

1. Tüm local Products → server INSERT ON CONFLICT DO NOTHING
   (local'de olup server'da olmayanlar eklenir, kalanlar atlanır)
2. Tüm local ProductImages → server UPDATE by Id
   (server'da aynı Id'li kayıt varsa ImageUrl/SortOrder/IsMain güncellenir)

DRY_RUN = True  → sadece sayıları raporlar, değişiklik yapmaz
DRY_RUN = False → gerçek INSERT/UPDATE çalıştırır
"""
import os, sys, io, time
import paramiko
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

DRY_RUN = False  # Önce True ile kontrol et, sonra False ile çalıştır

LOCAL_DSN = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if '=' in _line and not _line.startswith('#'):
                _k, _, _v = _line.partition('=')
                if _k.strip() not in os.environ:
                    os.environ[_k.strip()] = _v.strip()

SSH_HOST = os.environ['DEPLOY_SSH_HOST']
SSH_USER = os.environ['DEPLOY_SSH_USER']
SSH_PASS = os.environ['DEPLOY_SSH_PASSWORD']

CONTAINER = 'ecom-postgres-1'
DB_USER   = 'ecom'
DB_NAME   = 'EcomDb'

# ------------------------------------------------------------------ #
# Yardımcılar
# ------------------------------------------------------------------ #

def ssh_connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=30)
    return c

def run(client, cmd, timeout=120):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def psql_file(client, remote_sql_path, timeout=1800):
    cmd = f"docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} < {remote_sql_path}"
    return run(client, cmd, timeout=timeout)

def upload_text(sftp, content, remote_path):
    buf = io.BytesIO(content.encode('utf-8'))
    sftp.putfo(buf, remote_path)

def upload_buf(sftp, buf, remote_path):
    buf.seek(0)
    size = buf.seek(0, 2)
    buf.seek(0)
    sftp.putfo(buf, remote_path)
    return size

def docker_cp(client, host_path, container_path, timeout=300):
    return run(client, f"docker cp {host_path} {CONTAINER}:{container_path}", timeout=timeout)

# ------------------------------------------------------------------ #
# 1. Local sayımlar
# ------------------------------------------------------------------ #
print("=" * 65)
print(f"LOCAL → SERVER SYNC  |  DRY_RUN={DRY_RUN}")
print("=" * 65)

t_total = time.time()

print("\n[1] Local sayımlar...")
local_conn = psycopg2.connect(LOCAL_DSN)
cur = local_conn.cursor()

cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
local_product_count = cur.fetchone()[0]

cur.execute('SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false')
local_image_count = cur.fetchone()[0]

print(f"  Products       : {local_product_count:,}")
print(f"  ProductImages  : {local_image_count:,}")

# ------------------------------------------------------------------ #
# 2. Server sayımlar (SSH)
# ------------------------------------------------------------------ #
print("\n[2] Server sayımlar...")
client = ssh_connect()
sftp = client.open_sftp()

count_sql = """\
SELECT
  (SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false) AS prod,
  (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false) AS img,
  (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false AND "ImageUrl" LIKE '%no-image%') AS no_img;
"""
upload_text(sftp, count_sql, '/tmp/count_check.sql')
count_result = psql_file(client, '/tmp/count_check.sql', timeout=120)
print(f"  {count_result}")

if DRY_RUN:
    print("\n[DRY_RUN=True] Sayımlar tamamlandı.")
    print("DRY_RUN=False yapıp tekrar çalıştırın → gerçek sync yapılır.")
    cur.close(); local_conn.close(); sftp.close(); client.close()
    sys.exit(0)

# ------------------------------------------------------------------ #
# 3. Products CSV export (local → BytesIO)
# ------------------------------------------------------------------ #
print(f"\n[3] {local_product_count:,} Products dışa aktarılıyor...")
t0 = time.time()

buf_products = io.BytesIO()
cur.copy_expert("""
COPY (
    SELECT
        "Id","Name","Slug","Description","ShortDescription",
        "SKU","Barcode","ProductType","BrandId","CategoryId",
        "Price","DiscountPrice","Currency","TaxRate",
        "IsActive","IsPublished","IsFeatured",
        "MetaTitle","MetaDescription",
        "Icon","StylesJson","VideoUrl",
        "OemPartNumber","Chassis","VehicleModel",
        "ImportedFromSourceId","CreatedByAdminId",
        "CreatedDate","UpdatedDate","IsDeleted","DataSource"
    FROM "Products"
    WHERE "IsDeleted"=false
    ORDER BY "CreatedDate"
) TO STDOUT (FORMAT CSV, HEADER)
""", buf_products)

prod_mb = buf_products.tell() / 1024 / 1024
print(f"  Süre: {time.time()-t0:.0f}s  |  Boyut: {prod_mb:.1f} MB")

# ------------------------------------------------------------------ #
# 4. ProductImages CSV export
# ------------------------------------------------------------------ #
print(f"\n[4] {local_image_count:,} ProductImages dışa aktarılıyor...")
t0 = time.time()

buf_images = io.BytesIO()
cur.copy_expert("""
COPY (
    SELECT
        "Id","ProductId","ImageUrl","SortOrder",
        "IsMain","AltText","CreatedDate","UpdatedDate",
        "IsDeleted","DataSource"
    FROM "ProductImages"
    WHERE "IsDeleted"=false
    ORDER BY "ProductId","SortOrder"
) TO STDOUT (FORMAT CSV, HEADER)
""", buf_images)

img_mb = buf_images.tell() / 1024 / 1024
print(f"  Süre: {time.time()-t0:.0f}s  |  Boyut: {img_mb:.1f} MB")

cur.close(); local_conn.close()

# ------------------------------------------------------------------ #
# 5. CSV'leri server'a yükle (SFTP)
# ------------------------------------------------------------------ #
print(f"\n[5] CSV'ler server'a yükleniyor  (toplam ~{prod_mb+img_mb:.0f} MB)...")

t0 = time.time()
upload_buf(sftp, buf_products, '/tmp/products_sync.csv')
print(f"  products_sync.csv yüklendi ({time.time()-t0:.0f}s)")

t0 = time.time()
upload_buf(sftp, buf_images, '/tmp/images_sync.csv')
print(f"  images_sync.csv yüklendi ({time.time()-t0:.0f}s)")

# docker cp: host → container
print("  docker cp başlıyor...")
t0 = time.time()
docker_cp(client, '/tmp/products_sync.csv', '/tmp/products_sync.csv', timeout=300)
docker_cp(client, '/tmp/images_sync.csv',  '/tmp/images_sync.csv',  timeout=300)
print(f"  docker cp tamamlandı ({time.time()-t0:.0f}s)")

# ------------------------------------------------------------------ #
# 6a. Products INSERT
# ------------------------------------------------------------------ #
print("\n[6a] Server'da Products INSERT...")

insert_products_sql = """\
-- Temp tablo
DROP TABLE IF EXISTS _tmp_prod;
CREATE TEMP TABLE _tmp_prod (
    "Id" UUID, "Name" VARCHAR(300), "Slug" VARCHAR(300),
    "Description" TEXT, "ShortDescription" TEXT,
    "SKU" VARCHAR(100), "Barcode" VARCHAR(100),
    "ProductType" INT, "BrandId" UUID, "CategoryId" UUID,
    "Price" NUMERIC(18,2), "DiscountPrice" NUMERIC(18,2),
    "Currency" VARCHAR(10), "TaxRate" NUMERIC(5,2),
    "IsActive" BOOL, "IsPublished" BOOL, "IsFeatured" BOOL,
    "MetaTitle" TEXT, "MetaDescription" TEXT,
    "Icon" TEXT, "StylesJson" TEXT, "VideoUrl" TEXT,
    "OemPartNumber" TEXT, "Chassis" TEXT, "VehicleModel" TEXT,
    "ImportedFromSourceId" UUID, "CreatedByAdminId" UUID,
    "CreatedDate" TIMESTAMPTZ, "UpdatedDate" TIMESTAMPTZ,
    "IsDeleted" BOOL, "DataSource" TEXT
);

COPY _tmp_prod FROM '/tmp/products_sync.csv' (FORMAT CSV, HEADER);

-- FK güvenliği: server'da olmayan referansları NULL yap
UPDATE _tmp_prod SET "BrandId" = NULL
WHERE "BrandId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Brands" WHERE "Id" = "BrandId");

UPDATE _tmp_prod SET "CategoryId" = (
    SELECT "Id" FROM "Categories" WHERE "Name"='Otomotiv' AND "IsDeleted"=false LIMIT 1
)
WHERE "CategoryId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Categories" WHERE "Id" = "CategoryId" AND "IsDeleted"=false);

UPDATE _tmp_prod SET "ImportedFromSourceId" = NULL
WHERE "ImportedFromSourceId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "ExternalSources" WHERE "Id" = "ImportedFromSourceId");

UPDATE _tmp_prod SET "CreatedByAdminId" = NULL
WHERE "CreatedByAdminId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "AdminUsers" WHERE "Id" = "CreatedByAdminId");

-- INSERT: mevcut olanlar (Id çakışması) atlanır
WITH ins AS (
    INSERT INTO "Products" (
        "Id","Name","Slug","Description","ShortDescription",
        "SKU","Barcode","ProductType","BrandId","CategoryId",
        "Price","DiscountPrice","Currency","TaxRate",
        "IsActive","IsPublished","IsFeatured",
        "MetaTitle","MetaDescription",
        "Icon","StylesJson","VideoUrl",
        "OemPartNumber","Chassis","VehicleModel",
        "ImportedFromSourceId","CreatedByAdminId",
        "CreatedDate","UpdatedDate","IsDeleted","DataSource"
    )
    SELECT
        "Id","Name","Slug","Description","ShortDescription",
        "SKU","Barcode","ProductType","BrandId","CategoryId",
        "Price","DiscountPrice","Currency","TaxRate",
        "IsActive","IsPublished","IsFeatured",
        "MetaTitle","MetaDescription",
        "Icon","StylesJson","VideoUrl",
        "OemPartNumber","Chassis","VehicleModel",
        "ImportedFromSourceId","CreatedByAdminId",
        "CreatedDate","UpdatedDate","IsDeleted","DataSource"
    FROM _tmp_prod
    ON CONFLICT DO NOTHING
    RETURNING "Id"
)
SELECT COUNT(*) AS eklenen_urun FROM ins;
"""
upload_text(sftp, insert_products_sql, '/tmp/insert_products.sql')
t0 = time.time()
result_prod = psql_file(client, '/tmp/insert_products.sql', timeout=3600)
print(f"  Süre: {time.time()-t0:.0f}s")
print(f"  {result_prod}")

# ------------------------------------------------------------------ #
# 6b. ProductImages UPDATE
# ------------------------------------------------------------------ #
print("\n[6b] Server'da ProductImages UPDATE...")

update_images_sql = """\
-- Temp tablo
DROP TABLE IF EXISTS _tmp_img;
CREATE TEMP TABLE _tmp_img (
    "Id" UUID, "ProductId" UUID, "ImageUrl" TEXT,
    "SortOrder" INT, "IsMain" BOOL, "AltText" TEXT,
    "CreatedDate" TIMESTAMPTZ, "UpdatedDate" TIMESTAMPTZ,
    "IsDeleted" BOOL, "DataSource" TEXT
);

COPY _tmp_img FROM '/tmp/images_sync.csv' (FORMAT CSV, HEADER);

-- UPDATE: server'da aynı Id'li kayıt varsa ImageUrl güncellenir
WITH upd AS (
    UPDATE "ProductImages" pi
    SET
        "ImageUrl"    = tmp."ImageUrl",
        "SortOrder"   = tmp."SortOrder",
        "IsMain"      = tmp."IsMain",
        "AltText"     = tmp."AltText",
        "UpdatedDate" = NOW()
    FROM _tmp_img tmp
    WHERE pi."Id" = tmp."Id"
      AND pi."IsDeleted" = false
    RETURNING pi."Id"
)
SELECT COUNT(*) AS guncellenen_resim FROM upd;
"""
upload_text(sftp, update_images_sql, '/tmp/update_images.sql')
t0 = time.time()
result_img = psql_file(client, '/tmp/update_images.sql', timeout=3600)
print(f"  Süre: {time.time()-t0:.0f}s")
print(f"  {result_img}")

# ------------------------------------------------------------------ #
# 7. Final durum
# ------------------------------------------------------------------ #
print("\n[7] Final durum...")
final_sql = """\
SELECT
    (SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false) AS total_products,
    (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false) AS total_images,
    (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false
        AND "ImageUrl" LIKE '%no-image%') AS no_image_kalan;
"""
upload_text(sftp, final_sql, '/tmp/final_check.sql')
print(f"  {psql_file(client, '/tmp/final_check.sql', timeout=120)}")

sftp.close()
client.close()

elapsed = time.time() - t_total
print(f"\n{'='*65}")
print(f"TAMAMLANDI  |  Toplam süre: {elapsed:.0f}s ({elapsed/60:.1f}dk)")
print(f"{'='*65}")
