# -*- coding: utf-8 -*-
"""
Shows the URL domain distribution in ProductImages.
Identifies which images are on R2 vs external sources.
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

host    = os.environ['DEPLOY_SSH_HOST']
user    = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']
pg_user = os.environ.get('POSTGRES_USER', 'ecom')
pg_db   = os.environ.get('POSTGRES_DB', 'EcomDb')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run_sql(sql, timeout=60):
    stdin, stdout, stderr = client.exec_command(
        f'docker exec -i ecom-postgres-1 psql -U {pg_user} -d {pg_db}',
        timeout=timeout)
    stdin.write(sql)
    stdin.channel.shutdown_write()
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

sql = """
SELECT
  CASE
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/%' THEN 'R2 (images.autoforcepart.com)'
    WHEN "ImageUrl" LIKE 'http://api.autoforcepart.com/%'     THEN 'Eski API (local)'
    WHEN "ImageUrl" LIKE 'https://storage.googleapis.com/%'  THEN 'Google Cloud Storage (OYP)'
    WHEN "ImageUrl" LIKE 'https://cdn.onl.com.tr/%'          THEN 'CDN onl.com.tr'
    WHEN "ImageUrl" LIKE '%boyner%'                          THEN 'Boyner CDN'
    WHEN "ImageUrl" LIKE '%bulutx%'                          THEN 'BulutX/eski host'
    ELSE 'Diğer: ' || LEFT(regexp_replace("ImageUrl", 'https?://([^/]+)/.*', E'\\\\1'), 60)
  END AS domain_group,
  COUNT(*) AS count
FROM "ProductImages"
WHERE "IsDeleted" = false
GROUP BY 1
ORDER BY 2 DESC;
"""
print("=== ProductImages URL domain dağılımı ===")
print(run_sql(sql, timeout=30))

sql2 = """
SELECT COUNT(*) AS total_non_r2
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%'
  AND "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%';
"""
print("\n=== R2 dışı toplam ===")
print(run_sql(sql2, timeout=30))

client.close()
