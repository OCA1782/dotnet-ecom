# -*- coding: utf-8 -*-
"""
R2'ye taşınamayan (dış CDN URL'i hâlâ kalan) ProductImage kayıtlarını
no-image placeholder URL ile günceller.

Etkilenen:
  - storage.googleapis.com (OYP/Google Cloud Storage)
  - cdn.onl.com.tr
  - boyner CDN
"""
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

NO_IMAGE = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']
pg_user  = os.environ.get('POSTGRES_USER', 'ecom')
pg_db    = os.environ.get('POSTGRES_DB', 'EcomDb')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run_sql(sql, timeout=120):
    stdin, stdout, stderr = client.exec_command(
        f'docker exec -i ecom-postgres-1 psql -U {pg_user} -d {pg_db}',
        timeout=timeout)
    stdin.write(sql)
    stdin.channel.shutdown_write()
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

# 1. Önce sayıları göster
sql_count = f"""
SELECT
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://storage.googleapis.com/%') AS google_cloud,
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://cdn.onl.com.tr/%')         AS onl_cdn,
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE '%boyner%')                         AS boyner,
  COUNT(*) FILTER (
    WHERE "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%'
  ) AS toplam_dis_cdn
FROM "ProductImages"
WHERE "IsDeleted" = false;
"""
print("=== Güncellenecek kayıt sayıları ===")
print(run_sql(sql_count, timeout=30))

# 2. Güncelle
sql_update = f"""
UPDATE "ProductImages"
SET
  "ImageUrl"    = '{NO_IMAGE}',
  "UpdatedDate" = NOW()
WHERE "IsDeleted" = false
  AND "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%';

SELECT CONCAT('Güncellenen kayıt: ', COUNT(*)) AS result
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "ImageUrl" = '{NO_IMAGE}'
  AND "UpdatedDate" > NOW() - INTERVAL '1 minute';
"""
print("\n=== No-image ile güncelleniyor ===")
print(run_sql(sql_update, timeout=120))

# 3. Son durum
sql_verify = f"""
SELECT
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%') AS r2_product,
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}')                                     AS no_image,
  COUNT(*) FILTER (WHERE "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%')      AS dis_cdn_kalan
FROM "ProductImages"
WHERE "IsDeleted" = false;
"""
print("\n=== Son durum ===")
print(run_sql(sql_verify, timeout=30))

client.close()
print("\n=== TAMAMLANDI ===")
