# -*- coding: utf-8 -*-
"""
1. Scraping hata sayfası kayıtlarını sil  (Sayfa Bulunamadı vb.)
2. 6 alanda birebir aynı duplicate kayıtları sil (en eski tutulur)
Her iki DB'de (local + server) çalışır.
"""
import os, sys, io, time, paramiko, psycopg2
sys.stdout.reconfigure(encoding='utf-8')

LOCAL_DSN = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
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

GARBAGE_NAMES = [
    'Sayfa Bulunamadı',
    '\U0001f6a7 Site Güncelleniyor',
    'Geçersiz İstek',
    'Web server is down Error code 521',
    'Access denied',
    '403 Forbidden',
    'Forbidden',
    '500 Internal Server Error',
]

GARBAGE_SQL = """
-- ── 1. Hata sayfası ürünleri ────────────────────────────────────────────────
CREATE TEMP TABLE _garbage_ids AS
SELECT p."Id"
FROM "Products" p
WHERE p."IsDeleted" = false
  AND p."SKU" IS NULL
  AND p."Name" = ANY(ARRAY[
    'Sayfa Bulunamadı',
    '\U0001f6a7 Site Güncelleniyor',
    'Geçersiz İstek',
    'Web server is down Error code 521',
    'Access denied',
    '403 Forbidden',
    'Forbidden',
    '500 Internal Server Error'
  ]);

-- ── 2. Birebir duplicate (6 alan aynı, en eski tutulur) ────────────────────
INSERT INTO _garbage_ids
SELECT p."Id"
FROM "Products" p
JOIN (
    SELECT
        MIN("Id"::text)::uuid AS keep_id,
        "Name","BrandId","CategoryId","VehicleModel","Price","Description"
    FROM "Products"
    WHERE "IsDeleted"=false AND "SKU" IS NULL
    GROUP BY "Name","BrandId","CategoryId","VehicleModel","Price","Description"
    HAVING COUNT(*) > 1
) dup ON dup."Name" = p."Name"
     AND (dup."BrandId" = p."BrandId" OR (dup."BrandId" IS NULL AND p."BrandId" IS NULL))
     AND dup."CategoryId" = p."CategoryId"
     AND (dup."VehicleModel" = p."VehicleModel" OR (dup."VehicleModel" IS NULL AND p."VehicleModel" IS NULL))
     AND dup."Price" = p."Price"
     AND (dup."Description" = p."Description" OR (dup."Description" IS NULL AND p."Description" IS NULL))
WHERE p."Id" != dup.keep_id
  AND p."IsDeleted" = false
  AND p."SKU" IS NULL
ON CONFLICT DO NOTHING;

SELECT COUNT(*) AS silinecek FROM _garbage_ids;

-- ── 3. İlgili ProductImages sil ───────────────────────────────────────────
DELETE FROM "ProductImages"
WHERE "ProductId" IN (SELECT "Id" FROM _garbage_ids);

-- ── 4. Products sil ───────────────────────────────────────────────────────
DELETE FROM "Products"
WHERE "Id" IN (SELECT "Id" FROM _garbage_ids);

SELECT 'Silme tamamlandi' AS durum,
       (SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false) AS kalan_urun;
"""


def run_local(sql_text):
    conn = psycopg2.connect(LOCAL_DSN)
    conn.autocommit = False
    cur = conn.cursor()
    try:
        for stmt in sql_text.split(';'):
            stmt = stmt.strip()
            if stmt:
                cur.execute(stmt)
                if cur.description:
                    cols = [d[0] for d in cur.description]
                    rows = cur.fetchall()
                    print('  ' + ' | '.join(cols))
                    for row in rows:
                        print('  ' + ' | '.join(str(v) for v in row))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f'  HATA: {e}')
    finally:
        cur.close()
        conn.close()


def ssh_connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=30)
    return c


# ── LOCAL ────────────────────────────────────────────────────────────────────
print('=' * 60)
print('LOCAL DB SILME')
print('=' * 60)
t0 = time.time()
run_local(GARBAGE_SQL)
print(f'  Sure: {time.time()-t0:.1f}s')

# ── SERVER ───────────────────────────────────────────────────────────────────
print()
print('=' * 60)
print('SERVER DB SILME')
print('=' * 60)

ssh = ssh_connect()
sftp = ssh.open_sftp()
sftp.putfo(io.BytesIO(GARBAGE_SQL.encode('utf-8')), '/tmp/delete_garbage.sql')
sftp.close()

t1 = time.time()
_, out, err = ssh.exec_command(
    f'docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} < /tmp/delete_garbage.sql',
    timeout=300
)
print(out.read().decode('utf-8', errors='replace'))
e = err.read().decode('utf-8', errors='replace').strip()
if e:
    print(f'  STDERR: {e[:500]}')
print(f'  Sure: {time.time()-t1:.1f}s')
ssh.close()
print('\nTamamlandi.')
