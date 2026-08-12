# -*- coding: utf-8 -*-
"""
Local DB'deki orijinal ProductImages URL'lerini kullanarak
sunucudaki son 24 saatte no-image'a cevrilmis kayitlari restore eder.

DRY_RUN = True  --> sadece kac kayit etkilenecegini raporlar
DRY_RUN = False --> gercek UPDATE yapar
"""
import os, sys, io, csv
import paramiko
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

DRY_RUN = True

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if '=' in _line and not _line.startswith('#'):
                _k, _, _v = _line.partition('=')
                if _k.strip() not in os.environ:
                    os.environ[_k.strip()] = _v.strip()

NO_IMAGE = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

print("=== LOCAL DB'den orijinal URL'ler cekiliyor ===")
local_conn = psycopg2.connect(
    host='127.0.0.1', port=5435, dbname='EcomDb',
    user='ecom', password='ecom_dev_2026'
)
cur = local_conn.cursor()
cur.execute("""
    SELECT "Id"::text, "ImageUrl"
    FROM "ProductImages"
    WHERE "IsDeleted" = false
      AND "ImageUrl" != %s
""", (NO_IMAGE,))
local_rows = cur.fetchall()
cur.close()
local_conn.close()

print(f"Local'de restore edilebilir kayit sayisi: {len(local_rows):,}")

# CSV'ye yaz (Id, OriginalUrl) — UUID text olarak
buf = io.StringIO()
writer = csv.writer(buf, quoting=csv.QUOTE_MINIMAL)
writer.writerow(['id', 'original_url'])
for row_id, url in local_rows:
    writer.writerow([str(row_id), url])
csv_data = buf.getvalue().encode('utf-8')
print(f"CSV boyutu: {len(csv_data):,} bytes ({len(csv_data)/1024/1024:.1f} MB)")

# SSH baglantisi
host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=30)

def run(cmd, timeout=120):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("\n=== CSV sunucu host'una yukleniyor ===")
sftp = client.open_sftp()
with sftp.open('/tmp/local_images.csv', 'wb') as f:
    f.write(csv_data)
sftp.close()
print("Yuklendi.")

# Docker container'a kopyala
print("\n=== CSV Docker container'a kopyalaniyor ===")
print(run("docker cp /tmp/local_images.csv ecom-postgres-1:/tmp/local_images.csv", timeout=60))

# Eslesme analizi
check_sql = f"""
DROP TABLE IF EXISTS _restore_tmp;
CREATE TEMP TABLE _restore_tmp (id UUID, original_url TEXT);
COPY _restore_tmp FROM '/tmp/local_images.csv' CSV HEADER;

SELECT
  COUNT(*) AS eslesen_kayit,
  COUNT(*) FILTER (WHERE pi."ImageUrl" = '{NO_IMAGE}') AS no_image_olan,
  COUNT(*) FILTER (WHERE pi."UpdatedDate" > NOW() - INTERVAL '24 hours') AS son_24h_degisen
FROM "ProductImages" pi
INNER JOIN _restore_tmp t ON t.id = pi."Id"
WHERE pi."IsDeleted" = false;
"""

sftp2 = client.open_sftp()
with sftp2.open('/tmp/restore_check.sql', 'w') as f:
    f.write(check_sql)
sftp2.close()

print("\n=== Eslesme analizi ===")
result = run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/restore_check.sql", timeout=180)
print(result)

if DRY_RUN:
    print("\n[DRY_RUN=True] Gercek UPDATE yapilmadi.")
    print("Restore yapmak icin DRY_RUN=False yapip tekrar calistirin.")
else:
    print("\n=== RESTORE YAPILIYOR ===")
    restore_sql = f"""
DROP TABLE IF EXISTS _restore_tmp;
CREATE TEMP TABLE _restore_tmp (id UUID, original_url TEXT);
COPY _restore_tmp FROM '/tmp/local_images.csv' CSV HEADER;

WITH updated AS (
  UPDATE "ProductImages" pi
  SET "ImageUrl" = t.original_url
  FROM _restore_tmp t
  WHERE pi."Id" = t.id
    AND pi."IsDeleted" = false
    AND pi."ImageUrl" = '{NO_IMAGE}'
    AND pi."UpdatedDate" > NOW() - INTERVAL '24 hours'
  RETURNING pi."Id"
)
SELECT COUNT(*) AS restore_edilen FROM updated;
"""
    sftp3 = client.open_sftp()
    with sftp3.open('/tmp/restore_exec.sql', 'w') as f:
        f.write(restore_sql)
    sftp3.close()

    result2 = run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/restore_exec.sql", timeout=600)
    print(result2)

    # Son durum
    final_sql = f"""
SELECT
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}') AS no_image,
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%%') AS r2_product,
  COUNT(*) FILTER (WHERE "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%%') AS other_cdn,
  COUNT(*) AS total
FROM "ProductImages" WHERE "IsDeleted" = false;
"""
    sftp4 = client.open_sftp()
    with sftp4.open('/tmp/restore_final.sql', 'w') as f:
        f.write(final_sql)
    sftp4.close()
    print("\n=== Son Durum ===")
    print(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/restore_final.sql", timeout=60))

client.close()
print("\n=== TAMAMLANDI ===")
