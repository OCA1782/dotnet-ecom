# -*- coding: utf-8 -*-
"""
CSV dosyaları server'da mevcut (/tmp/prod_upsert.csv, /tmp/img_upsert.csv).
Sadece düzeltilmiş SQL çalıştırır.

Düzeltmeler:
  1. ImportedFromSources → NULL (tablo server'da yok, direkt NULL)
  2. ProductImages final count → transaction içine alındı
"""
import os, sys, io, time
import paramiko
sys.stdout.reconfigure(encoding='utf-8')

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

def ssh_connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=30)
    return c

def ssh_exec(ssh, cmd, timeout=900):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    o = out.read().decode('utf-8', errors='replace').strip()
    e = err.read().decode('utf-8', errors='replace').strip()
    return o, e

def docker_psql_file(ssh, remote_path, timeout=1800):
    cmd = f"docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} -q < {remote_path}"
    return ssh_exec(ssh, cmd, timeout)

def upload_sql(ssh, sql, remote_path):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode('utf-8')), remote_path)
    sftp.close()

PROD_COLS = ', '.join([
    '"Id"', '"Name"', '"Slug"', '"Description"', '"ShortDescription"',
    '"SKU"', '"Barcode"', '"ProductType"', '"BrandId"', '"CategoryId"',
    '"Price"', '"DiscountPrice"', '"Currency"', '"TaxRate"',
    '"IsActive"', '"IsPublished"', '"IsFeatured"',
    '"MetaTitle"', '"MetaDescription"', '"Icon"', '"StylesJson"', '"VideoUrl"',
    '"OemPartNumber"', '"Chassis"', '"VehicleModel"',
    '"ImportedFromSourceId"', '"CreatedByAdminId"', '"HasProductImage"',
    '"CreatedDate"', '"UpdatedDate"', '"IsDeleted"', '"DataSource"',
])

PROD_UPDATE = ', '.join([
    f'{c} = EXCLUDED.{c}'
    for c in [
        '"Name"', '"Slug"', '"Description"', '"ShortDescription"',
        '"SKU"', '"Barcode"', '"ProductType"', '"BrandId"', '"CategoryId"',
        '"Price"', '"DiscountPrice"', '"Currency"', '"TaxRate"',
        '"IsActive"', '"IsPublished"', '"IsFeatured"',
        '"MetaTitle"', '"MetaDescription"', '"Icon"', '"StylesJson"', '"VideoUrl"',
        '"OemPartNumber"', '"Chassis"', '"VehicleModel"',
        '"ImportedFromSourceId"', '"CreatedByAdminId"', '"HasProductImage"',
        '"CreatedDate"', '"UpdatedDate"', '"IsDeleted"', '"DataSource"',
    ]
])

IMG_COLS = ', '.join([
    '"Id"', '"ProductId"', '"ImageUrl"', '"SortOrder"', '"IsMain"', '"AltText"',
    '"CreatedDate"', '"UpdatedDate"', '"IsDeleted"', '"DataSource"',
])

IMG_UPDATE = ', '.join([
    f'{c} = EXCLUDED.{c}'
    for c in [
        '"ProductId"', '"ImageUrl"', '"SortOrder"', '"IsMain"', '"AltText"',
        '"CreatedDate"', '"UpdatedDate"', '"IsDeleted"', '"DataSource"',
    ]
])

PROD_SQL = f"""
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

-- ImportedFromSources tablosu server'da olmadigi icin direkt NULL
UPDATE _tmp_prod SET "ImportedFromSourceId" = NULL;

-- CreatedByAdminId direkt NULL
UPDATE _tmp_prod SET "CreatedByAdminId" = NULL;

-- Slug çakışması: yeni satirlarda (server'da Id'si yok) suffix ekle
UPDATE _tmp_prod t
SET "Slug" = t."Slug" || '-' || LEFT(t."Id"::text, 8)
WHERE t."Id" NOT IN (SELECT "Id" FROM "Products")
  AND EXISTS (SELECT 1 FROM "Products" p WHERE p."Slug" = t."Slug");

-- SKU çakışması: yeni satirlarda → NULL
UPDATE _tmp_prod t
SET "SKU" = NULL
WHERE t."SKU" IS NOT NULL
  AND t."Id" NOT IN (SELECT "Id" FROM "Products")
  AND EXISTS (SELECT 1 FROM "Products" p WHERE p."SKU" = t."SKU");

-- Sayimlar (transaction icinde)
SELECT
    COUNT(*) FILTER (WHERE "Id" NOT IN (SELECT "Id" FROM "Products")) AS yeni_urun,
    COUNT(*) FILTER (WHERE "Id"     IN (SELECT "Id" FROM "Products")) AS guncellenecek
FROM _tmp_prod;

-- UPSERT
INSERT INTO "Products" ({PROD_COLS})
SELECT {PROD_COLS} FROM _tmp_prod
ON CONFLICT ("Id") DO UPDATE SET
    {PROD_UPDATE};

COMMIT;

SELECT COUNT(*) AS toplam_products_after FROM "Products";
"""

IMG_SQL = f"""
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

-- Sayimlar
SELECT
    COUNT(*) FILTER (WHERE "Id" NOT IN (SELECT "Id" FROM "ProductImages")) AS yeni_resim,
    COUNT(*) FILTER (WHERE "Id"     IN (SELECT "Id" FROM "ProductImages")) AS guncellenecek
FROM _tmp_img;

-- UPSERT
INSERT INTO "ProductImages" ({IMG_COLS})
SELECT {IMG_COLS} FROM _tmp_img
ON CONFLICT ("Id") DO UPDATE SET
    {IMG_UPDATE};

COMMIT;

SELECT COUNT(*) AS toplam_images_after FROM "ProductImages";
"""

ssh = ssh_connect()

# ── Products UPSERT ───────────────────────────────────────────────────────────
print("=" * 60)
print("[1/2] Products UPSERT")
print("=" * 60)
o, e = ssh_exec(ssh, f"ls /tmp/prod_upsert.csv 2>/dev/null && echo OK || echo MISSING")
print(f"  CSV kontrol: {o}")
if 'MISSING' in o:
    print("  HATA: CSV server'da bulunamadi. sync_upsert_to_server.py tekrar calistirin.")
    ssh.close(); sys.exit(1)

upload_sql(ssh, PROD_SQL, '/tmp/prod_fix.sql')
print("  SQL calistiriliyor...")
t0 = time.time()
o, e = docker_psql_file(ssh, '/tmp/prod_fix.sql', timeout=1800)
print(f"  Tamamlandi ({time.time()-t0:.1f}s)")
if o: print(f"  {o}")
if e: print(f"  STDERR: {e[:800]}")

# ── ProductImages UPSERT ──────────────────────────────────────────────────────
print()
print("=" * 60)
print("[2/2] ProductImages UPSERT")
print("=" * 60)
o, e = ssh_exec(ssh, f"ls /tmp/img_upsert.csv 2>/dev/null && echo OK || echo MISSING")
print(f"  CSV kontrol: {o}")
if 'MISSING' in o:
    print("  HATA: img CSV server'da bulunamadi.")
    ssh.close(); sys.exit(1)

upload_sql(ssh, IMG_SQL, '/tmp/img_fix.sql')
print("  SQL calistiriliyor...")
t1 = time.time()
o, e = docker_psql_file(ssh, '/tmp/img_fix.sql', timeout=3600)
print(f"  Tamamlandi ({time.time()-t1:.1f}s)")
if o: print(f"  {o}")
if e: print(f"  STDERR: {e[:800]}")

# ── Final kontrol ─────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("FINAL KONTROL")
print("=" * 60)
_, out_e = ssh.exec_command(
    f'echo "SELECT \'Products\' as tbl, COUNT(*) FROM \\"Products\\" '
    f'UNION ALL SELECT \'ProductImages\', COUNT(*) FROM \\"ProductImages\\";" '
    f'| docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME}',
    timeout=60
)
_, err = ssh.exec_command('echo done', timeout=5)

o2, e2 = ssh_exec(ssh,
    f'echo "SELECT \'Products\' as tbl, COUNT(*) FROM \\"Products\\" '
    f'UNION ALL SELECT \'ProductImages\', COUNT(*) FROM \\"ProductImages\\";" '
    f'| docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME}'
)
print(o2)
ssh.close()
print("\nTamamlandi.")
