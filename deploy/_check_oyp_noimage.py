# -*- coding: utf-8 -*-
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

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run_sql(sql, timeout=60):
    stdin, stdout, stderr = client.exec_command(
        f'docker exec -i ecom-postgres-1 psql -U {pg_user} -d {pg_db}', timeout=timeout)
    stdin.write(sql)
    stdin.channel.shutdown_write()
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

# Check specific URL the user mentioned
print("=== Örnek OYP no-image URL varlığı ===")
print(run_sql("""SELECT COUNT(*) FROM "ProductImages"
WHERE "IsDeleted"=false
  AND "ImageUrl"='https://images.autoforcepart.com/products/cbc497ca514d4a938c03cd0350c93ab3.png';"""))

# Duplicates with threshold >= 2
print("\n=== R2'de 2+ kez tekrar eden URL'ler (top 20) ===")
print(run_sql("""
SELECT "ImageUrl", COUNT(*) AS cnt
FROM "ProductImages"
WHERE "IsDeleted"=false
  AND "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%'
GROUP BY "ImageUrl"
HAVING COUNT(*)>=2
ORDER BY cnt DESC
LIMIT 20;
"""))

# Check DataSource field
print("\n=== DataSource dağılımı (ProductImages) ===")
print(run_sql("""
SELECT COALESCE("DataSource",'(null)') AS source, COUNT(*) AS cnt
FROM "ProductImages"
WHERE "IsDeleted"=false
GROUP BY "DataSource"
ORDER BY cnt DESC
LIMIT 10;
"""))

client.close()
