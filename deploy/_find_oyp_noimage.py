# -*- coding: utf-8 -*-
"""
R2'ye migrate edilmiş OYP (onlineyedekparca) no-image resimlerini tespit eder.
50+ kez tekrarlanan R2 ürün görselleri listelenir — bunlar OYP no-image adaylarıdır.
Onaylanan URL'ler standart no-image ile değiştirilir.
"""
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

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

NO_IMAGE = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run_sql(sql, timeout=60):
    stdin, stdout, stderr = client.exec_command(
        f'docker exec -i ecom-postgres-1 psql -U {pg_user} -d {pg_db}', timeout=timeout)
    stdin.write(sql)
    stdin.channel.shutdown_write()
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

# 1. Find duplicate R2 product image URLs
sql_find = """
SELECT "ImageUrl", COUNT(*) AS cnt
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%'
GROUP BY "ImageUrl"
HAVING COUNT(*) >= 50
ORDER BY cnt DESC
LIMIT 30;
"""
print("=== R2'de 50+ tekrar eden ürün görselleri (OYP no-image adayları) ===")
result = run_sql(sql_find)
print(result)

# 2. Summary
sql_summary = """
SELECT
  COUNT(DISTINCT "ImageUrl") AS distinct_duplicate_urls,
  SUM(cnt) AS total_records
FROM (
  SELECT "ImageUrl", COUNT(*) AS cnt
  FROM "ProductImages"
  WHERE "IsDeleted" = false
    AND "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%'
  GROUP BY "ImageUrl"
  HAVING COUNT(*) >= 50
) sub;
"""
print("\n=== Özet ===")
print(run_sql(sql_summary))

# 3. Replace duplicates with standard no-image
print("\n=== No-image ile değiştiriliyor ===")
sql_replace = f"""
UPDATE "ProductImages"
SET "ImageUrl" = '{NO_IMAGE}', "UpdatedDate" = NOW()
WHERE "IsDeleted" = false
  AND "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%'
  AND "ImageUrl" IN (
    SELECT "ImageUrl"
    FROM "ProductImages"
    WHERE "IsDeleted" = false
      AND "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%'
    GROUP BY "ImageUrl"
    HAVING COUNT(*) >= 50
  );

SELECT CONCAT('Güncellenen: ', COUNT(*)) AS result
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "ImageUrl" = '{NO_IMAGE}'
  AND "UpdatedDate" > NOW() - INTERVAL '1 minute';
"""
print(run_sql(sql_replace, timeout=120))

# 4. Final state
sql_verify = f"""
SELECT
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%') AS r2_product,
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}') AS no_image,
  COUNT(*) FILTER (WHERE "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%') AS dis_cdn
FROM "ProductImages"
WHERE "IsDeleted" = false;
"""
print("\n=== Son durum ===")
print(run_sql(sql_verify, timeout=30))

client.close()
print("\n=== TAMAMLANDI ===")
