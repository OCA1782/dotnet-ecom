# -*- coding: utf-8 -*-
"""
Local EcomDb ProductImages → BulutX Server EcomDb.

İki işlem tek seferde:
  1. UPDATE: server'da Id eşleşen kayıtların ImageUrl/SortOrder/IsMain güncellenir
  2. INSERT: local'de olup server'da olmayan kayıtlar eklenir
             (ProductId server'da mevcut olmalı — FK güvenliği)

ON CONFLICT DO NOTHING — tekrar çalıştırma güvenli.
DRY_RUN = True  → sayı raporu, değişiklik yok
DRY_RUN = False → gerçek UPDATE + INSERT
"""
import os, sys, io, time
import paramiko
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

DRY_RUN = False

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

SSH_HOST  = os.environ['DEPLOY_SSH_HOST']
SSH_USER  = os.environ['DEPLOY_SSH_USER']
SSH_PASS  = os.environ['DEPLOY_SSH_PASSWORD']
CONTAINER = 'ecom-postgres-1'
DB_USER   = 'ecom'
DB_NAME   = 'EcomDb'

# ------------------------------------------------------------------ #
def ssh_connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=30)
    return c

def run(client, cmd, timeout=120):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

def psql_file(client, remote_path, timeout=7200):
    cmd = f"docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} < {remote_path}"
    return run(client, cmd, timeout=timeout)

def upload_text(sftp, content, remote_path):
    sftp.putfo(io.BytesIO(content.encode('utf-8')), remote_path)

def upload_buf(sftp, buf, remote_path):
    buf.seek(0)
    sftp.putfo(buf, remote_path)

# ------------------------------------------------------------------ #
print("=" * 60)
print(f"IMAGES LOCAL → SERVER (UPDATE + INSERT)  |  DRY_RUN={DRY_RUN}")
print("=" * 60)
t_total = time.time()

# --- Sayımlar ---
local_conn = psycopg2.connect(LOCAL_DSN)
cur = local_conn.cursor()

cur.execute('SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false')
local_total = cur.fetchone()[0]
print(f"\nLocal ProductImages: {local_total:,}")

client = ssh_connect()
sftp   = client.open_sftp()

check_sql = """\
SELECT
  (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false) AS server_toplam,
  (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false
     AND "ImageUrl" LIKE '%no-image%') AS no_image;
"""
upload_text(sftp, check_sql, '/tmp/img_check.sql')
print(f"Server durumu:\n  {psql_file(client, '/tmp/img_check.sql', timeout=60)}")

if DRY_RUN:
    print("\n[DRY_RUN=True] Gerçek işlem yapılmadı.")
    cur.close(); local_conn.close(); sftp.close(); client.close()
    sys.exit(0)

# ------------------------------------------------------------------ #
# 1. Tüm local ProductImages CSV olarak dışa aktar
# ------------------------------------------------------------------ #
print(f"\n[1] {local_total:,} ProductImage dışa aktarılıyor...")
t0 = time.time()

buf = io.BytesIO()
cur.copy_expert("""
COPY (
    SELECT
        "Id", "ProductId", "ImageUrl", "SortOrder",
        "IsMain", "AltText", "CreatedDate", "UpdatedDate",
        "IsDeleted", "DataSource"
    FROM "ProductImages"
    WHERE "IsDeleted" = false
    ORDER BY "ProductId", "SortOrder"
) TO STDOUT (FORMAT CSV, HEADER)
""", buf)

csv_mb = buf.tell() / 1024 / 1024
print(f"  Süre: {time.time()-t0:.0f}s  |  Boyut: {csv_mb:.1f} MB")
cur.close(); local_conn.close()

# ------------------------------------------------------------------ #
# 2. SFTP yükle → docker cp
# ------------------------------------------------------------------ #
print(f"\n[2] Server'a yükleniyor ({csv_mb:.0f} MB)...")
t0 = time.time()
upload_buf(sftp, buf, '/tmp/all_images.csv')
print(f"  SFTP tamamlandı ({time.time()-t0:.0f}s)")

t0 = time.time()
run(client, f"docker cp /tmp/all_images.csv {CONTAINER}:/tmp/all_images.csv", timeout=300)
print(f"  docker cp tamamlandı ({time.time()-t0:.0f}s)")

# ------------------------------------------------------------------ #
# 3. Server'da UPDATE + INSERT
# ------------------------------------------------------------------ #
print("\n[3] Server'da UPDATE + INSERT...")

upsert_sql = """\
-- Temp tablo
DROP TABLE IF EXISTS _tmp_all_img;
CREATE TEMP TABLE _tmp_all_img (
    "Id" UUID, "ProductId" UUID, "ImageUrl" TEXT,
    "SortOrder" INT, "IsMain" BOOL, "AltText" TEXT,
    "CreatedDate" TIMESTAMPTZ, "UpdatedDate" TIMESTAMPTZ,
    "IsDeleted" BOOL, "DataSource" TEXT
);
COPY _tmp_all_img FROM '/tmp/all_images.csv' (FORMAT CSV, HEADER);

-- UPDATE: server'da aynı Id'li kayıtların URL'leri güncellenir
WITH upd AS (
    UPDATE "ProductImages" pi
    SET
        "ImageUrl"    = t."ImageUrl",
        "SortOrder"   = t."SortOrder",
        "IsMain"      = t."IsMain",
        "AltText"     = t."AltText",
        "UpdatedDate" = NOW()
    FROM _tmp_all_img t
    WHERE pi."Id" = t."Id"
      AND pi."IsDeleted" = false
    RETURNING pi."Id"
)
SELECT COUNT(*) AS guncellenen FROM upd;

-- INSERT: server'da olmayan kayıtlar eklenir (ProductId server'da var olmalı)
WITH ins AS (
    INSERT INTO "ProductImages" (
        "Id","ProductId","ImageUrl","SortOrder","IsMain",
        "AltText","CreatedDate","UpdatedDate","IsDeleted","DataSource"
    )
    SELECT
        t."Id", t."ProductId", t."ImageUrl", t."SortOrder", t."IsMain",
        t."AltText", t."CreatedDate", t."UpdatedDate", t."IsDeleted", t."DataSource"
    FROM _tmp_all_img t
    WHERE NOT EXISTS (
        SELECT 1 FROM "ProductImages" pi WHERE pi."Id" = t."Id"
    )
    AND EXISTS (
        SELECT 1 FROM "Products" p
        WHERE p."Id" = t."ProductId" AND p."IsDeleted" = false
    )
    ON CONFLICT DO NOTHING
    RETURNING "Id"
)
SELECT COUNT(*) AS eklenen FROM ins;
"""
upload_text(sftp, upsert_sql, '/tmp/upsert_images.sql')

t0 = time.time()
result = psql_file(client, '/tmp/upsert_images.sql', timeout=7200)
print(f"  Süre: {time.time()-t0:.0f}s")
print(f"  {result}")

# ------------------------------------------------------------------ #
# 4. Final durum
# ------------------------------------------------------------------ #
final_sql = """\
SELECT
    (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false) AS toplam,
    (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false
       AND "DataSource"='catalogiq') AS ciq,
    (SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted"=false
       AND "ImageUrl" LIKE '%no-image%') AS no_image;
"""
upload_text(sftp, final_sql, '/tmp/img_final.sql')
print(f"\n[4] Final durum:\n  {psql_file(client, '/tmp/img_final.sql', timeout=60)}")

sftp.close(); client.close()
elapsed = time.time() - t_total
print(f"\n{'='*60}")
print(f"TAMAMLANDI  |  {elapsed:.0f}s ({elapsed/60:.1f}dk)")
print(f"{'='*60}")
