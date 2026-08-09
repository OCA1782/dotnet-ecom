# -*- coding: utf-8 -*-
"""
Local EcomDb → BulutX Server EcomDb tam UPSERT senkronizasyonu.

Ürünler  : INSERT ON CONFLICT ("Id") DO UPDATE SET tüm alanlar
Görseller: INSERT ON CONFLICT ("Id") DO UPDATE SET tüm alanlar

FK safety: BrandId / ImportedFromSourceId / CreatedByAdminId → NULL if not found
           CategoryId → fallback to first available category if not found
Slug/SKU  : Yeni (server'da Id'si olmayan) satırlarda çakışırsa suffix eklenir
"""
import os, sys, io, time
import paramiko, psycopg2, psycopg2.extras
sys.stdout.reconfigure(encoding='utf-8')

# ── Config ────────────────────────────────────────────────────────────────────
LOCAL_DSN = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_env):
    with open(_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

SSH_HOST  = os.environ['DEPLOY_SSH_HOST']
SSH_USER  = os.environ['DEPLOY_SSH_USER']
SSH_PASS  = os.environ['DEPLOY_SSH_PASSWORD']
CONTAINER = 'ecom-postgres-1'
DB_USER   = 'ecom'
DB_NAME   = 'EcomDb'

PROD_COLS = [
    '"Id"', '"Name"', '"Slug"', '"Description"', '"ShortDescription"',
    '"SKU"', '"Barcode"', '"ProductType"', '"BrandId"', '"CategoryId"',
    '"Price"', '"DiscountPrice"', '"Currency"', '"TaxRate"',
    '"IsActive"', '"IsPublished"', '"IsFeatured"',
    '"MetaTitle"', '"MetaDescription"', '"Icon"', '"StylesJson"', '"VideoUrl"',
    '"OemPartNumber"', '"Chassis"', '"VehicleModel"',
    '"ImportedFromSourceId"', '"CreatedByAdminId"', '"HasProductImage"',
    '"CreatedDate"', '"UpdatedDate"', '"IsDeleted"', '"DataSource"',
]

IMG_COLS = [
    '"Id"', '"ProductId"', '"ImageUrl"', '"SortOrder"', '"IsMain"', '"AltText"',
    '"CreatedDate"', '"UpdatedDate"', '"IsDeleted"', '"DataSource"',
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def ssh_connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=30)
    return c

def ssh_exec(ssh, cmd, timeout=600):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    o = out.read().decode('utf-8', errors='replace').strip()
    e = err.read().decode('utf-8', errors='replace').strip()
    return o, e

def docker_psql(ssh, sql, timeout=600):
    safe = sql.replace("'", "'\\''")
    cmd  = f"echo '{safe}' | docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} -q"
    return ssh_exec(ssh, cmd, timeout)

def docker_psql_file(ssh, remote_path, timeout=1800):
    cmd = f"docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} -q < {remote_path}"
    return ssh_exec(ssh, cmd, timeout)

def sftp_upload(ssh, buf, remote_path):
    sftp = ssh.open_sftp()
    buf.seek(0)
    sftp.putfo(buf, remote_path)
    sftp.close()

def fmt(n): return f"{n:,}"

# ── Step 1: Export local Products ─────────────────────────────────────────────
print("=" * 60)
print("PRODUCTS UPSERT")
print("=" * 60)

print("\n[1/4] Local Products export ediliyor...")
t0 = time.time()
local = psycopg2.connect(LOCAL_DSN)
cur   = local.cursor()
cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
prod_count = cur.fetchone()[0]
print(f"  Toplam local Products (IsDeleted=false): {fmt(prod_count)}")

prod_buf = io.BytesIO()
cols_str = ', '.join(PROD_COLS)
copy_sql = f'COPY (SELECT {cols_str} FROM "Products" WHERE "IsDeleted"=false) TO STDOUT CSV HEADER'
cur.copy_expert(copy_sql, prod_buf)
prod_buf.seek(0, 2)
mb = prod_buf.tell() / 1024**2
prod_buf.seek(0)
print(f"  Export tamamlandi: {mb:.1f} MB ({time.time()-t0:.1f}s)")

cur.close(); local.close()

# ── Step 2: Upload & apply Products UPSERT ───────────────────────────────────
print("\n[2/4] Server'a Products yukleniyor ve UPSERT yapiliyor...")
ssh = ssh_connect()
sftp = ssh.open_sftp()
prod_buf.seek(0)
sftp.putfo(prod_buf, '/tmp/prod_upsert.csv')
sftp.close()
print(f"  SFTP upload tamamlandi")

o, e = ssh_exec(ssh, f"docker cp /tmp/prod_upsert.csv {CONTAINER}:/tmp/prod_upsert.csv")
print(f"  docker cp: ok")

update_cols = ', '.join(
    f'{c} = EXCLUDED.{c}'
    for c in PROD_COLS
    if c != '"Id"'
)

prod_sql = f"""
BEGIN;

CREATE TEMP TABLE _tmp_prod (
    "Id"                   uuid,
    "Name"                 text,
    "Slug"                 text,
    "Description"          text,
    "ShortDescription"     text,
    "SKU"                  text,
    "Barcode"              text,
    "ProductType"          int,
    "BrandId"              uuid,
    "CategoryId"           uuid,
    "Price"                numeric,
    "DiscountPrice"        numeric,
    "Currency"             text,
    "TaxRate"              numeric,
    "IsActive"             boolean,
    "IsPublished"          boolean,
    "IsFeatured"           boolean,
    "MetaTitle"            text,
    "MetaDescription"      text,
    "Icon"                 text,
    "StylesJson"           text,
    "VideoUrl"             text,
    "OemPartNumber"        text,
    "Chassis"              text,
    "VehicleModel"         text,
    "ImportedFromSourceId" uuid,
    "CreatedByAdminId"     uuid,
    "HasProductImage"      boolean,
    "CreatedDate"          timestamp,
    "UpdatedDate"          timestamp,
    "IsDeleted"            boolean,
    "DataSource"           text
) ON COMMIT DROP;

\\COPY _tmp_prod FROM '/tmp/prod_upsert.csv' CSV HEADER;

-- FK safety
UPDATE _tmp_prod SET "BrandId" = NULL
WHERE "BrandId" IS NOT NULL
  AND "BrandId" NOT IN (SELECT "Id" FROM "Brands");

UPDATE _tmp_prod SET "CategoryId" = (SELECT "Id" FROM "Categories" LIMIT 1)
WHERE "CategoryId" NOT IN (SELECT "Id" FROM "Categories");

UPDATE _tmp_prod SET "ImportedFromSourceId" = NULL
WHERE "ImportedFromSourceId" IS NOT NULL
  AND "ImportedFromSourceId" NOT IN (SELECT "Id" FROM "ImportedFromSources");

UPDATE _tmp_prod SET "CreatedByAdminId" = NULL;

-- Slug çakışması: sadece server'da Id'si OLMAYAN yeni satırlar için suffix ekle
UPDATE _tmp_prod t
SET "Slug" = t."Slug" || '-' || LEFT(t."Id"::text, 8)
WHERE t."Id" NOT IN (SELECT "Id" FROM "Products")
  AND EXISTS (
      SELECT 1 FROM "Products" p WHERE p."Slug" = t."Slug"
  );

-- SKU çakışması: sadece yeni satırlarda çakışan SKU → NULL
UPDATE _tmp_prod t
SET "SKU" = NULL
WHERE t."SKU" IS NOT NULL
  AND t."Id" NOT IN (SELECT "Id" FROM "Products")
  AND EXISTS (
      SELECT 1 FROM "Products" p WHERE p."SKU" = t."SKU"
  );

-- UPSERT
INSERT INTO "Products" ({cols_str})
SELECT {cols_str} FROM _tmp_prod
ON CONFLICT ("Id") DO UPDATE SET
    {update_cols};

COMMIT;

SELECT
    (SELECT COUNT(*) FROM "Products") AS total_after,
    COUNT(*) AS processed
FROM _tmp_prod;
"""

sql_path = '/tmp/prod_upsert.sql'
sftp = ssh.open_sftp()
sftp.putfo(io.BytesIO(prod_sql.encode('utf-8')), sql_path)
sftp.close()

print("  UPSERT calistiriliyor (bu adim birkaç dakika surebilir)...")
t1 = time.time()
o, e = docker_psql_file(ssh, sql_path, timeout=1800)
print(f"  Tamamlandi ({time.time()-t1:.1f}s)")
if o: print(f"  Output: {o}")
if e: print(f"  Stderr: {e[:500]}")

# ── Step 3: Export local ProductImages ───────────────────────────────────────
print("\n" + "=" * 60)
print("PRODUCT IMAGES UPSERT")
print("=" * 60)

print("\n[3/4] Local ProductImages export ediliyor...")
t2 = time.time()
local = psycopg2.connect(LOCAL_DSN)
cur   = local.cursor()
cur.execute('SELECT COUNT(*) FROM "ProductImages"')
img_count = cur.fetchone()[0]
print(f"  Toplam local ProductImages: {fmt(img_count)}")

img_buf  = io.BytesIO()
img_cols = ', '.join(IMG_COLS)
cur.copy_expert(
    f'COPY (SELECT {img_cols} FROM "ProductImages") TO STDOUT CSV HEADER',
    img_buf
)
img_buf.seek(0, 2)
mb2 = img_buf.tell() / 1024**2
img_buf.seek(0)
print(f"  Export tamamlandi: {mb2:.1f} MB ({time.time()-t2:.1f}s)")
cur.close(); local.close()

# ── Step 4: Upload & apply ProductImages UPSERT ──────────────────────────────
print("\n[4/4] Server'a ProductImages yukleniyor ve UPSERT yapiliyor...")
sftp = ssh.open_sftp()
img_buf.seek(0)
sftp.putfo(img_buf, '/tmp/img_upsert.csv')
sftp.close()
print(f"  SFTP upload tamamlandi")

o, e = ssh_exec(ssh, f"docker cp /tmp/img_upsert.csv {CONTAINER}:/tmp/img_upsert.csv")
print(f"  docker cp: ok")

img_update_cols = ', '.join(
    f'{c} = EXCLUDED.{c}'
    for c in IMG_COLS
    if c != '"Id"'
)

img_sql = f"""
BEGIN;

CREATE TEMP TABLE _tmp_img (
    "Id"          uuid,
    "ProductId"   uuid,
    "ImageUrl"    text,
    "SortOrder"   int,
    "IsMain"      boolean,
    "AltText"     text,
    "CreatedDate" timestamp,
    "UpdatedDate" timestamp,
    "IsDeleted"   boolean,
    "DataSource"  text
) ON COMMIT DROP;

\\COPY _tmp_img FROM '/tmp/img_upsert.csv' CSV HEADER;

-- ProductId server'da yoksa atla
DELETE FROM _tmp_img
WHERE "ProductId" NOT IN (SELECT "Id" FROM "Products");

-- UPSERT
INSERT INTO "ProductImages" ({img_cols})
SELECT {img_cols} FROM _tmp_img
ON CONFLICT ("Id") DO UPDATE SET
    {img_update_cols};

COMMIT;

SELECT
    (SELECT COUNT(*) FROM "ProductImages") AS total_after,
    COUNT(*) AS processed
FROM _tmp_img;
"""

sql_path2 = '/tmp/img_upsert.sql'
sftp = ssh.open_sftp()
sftp.putfo(io.BytesIO(img_sql.encode('utf-8')), sql_path2)
sftp.close()

print("  UPSERT calistiriliyor (bu adim uzun surebilir)...")
t3 = time.time()
o, e = docker_psql_file(ssh, sql_path2, timeout=3600)
print(f"  Tamamlandi ({time.time()-t3:.1f}s)")
if o: print(f"  Output: {o}")
if e: print(f"  Stderr: {e[:500]}")

# ── Final counts ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("FINAL DOGRULAMA")
print("=" * 60)
o, e = docker_psql(ssh,
    'SELECT \'Products\' as tbl, COUNT(*) FROM "Products" WHERE "IsDeleted"=false '
    'UNION ALL SELECT \'ProductImages\', COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false;'
)
print(o)
ssh.close()
print("\nTamamlandi.")
