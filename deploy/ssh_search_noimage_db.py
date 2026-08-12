# -*- coding: utf-8 -*-
"""DB'de no-image URL'lerini arar."""
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

OLD_URL  = 'https://www.autoforcepart.com/autoforcepart-no-image.png'
NEW_URL  = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def pg(sql):
    stdin, stdout, stderr = client.exec_command(
        'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t', timeout=60)
    stdin.write(sql.encode('utf-8'))
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

# Broad search across all url-ish columns
print("=== ProductImages LIKE search ===")
r1 = pg("SELECT COUNT(*) FROM \"ProductImages\" WHERE \"ImageUrl\" LIKE '%no-image%';")
print(f"no-image: {r1}")
r2 = pg("SELECT COUNT(*) FROM \"ProductImages\" WHERE \"ImageUrl\" LIKE '%autoforcepart.com%';")
print(f"autoforcepart.com: {r2}")
r3 = pg("SELECT DISTINCT \"ImageUrl\" FROM \"ProductImages\" WHERE \"ImageUrl\" LIKE '%autoforcepart.com%' LIMIT 5;")
print(f"Ornekler: {r3}")

print("\n=== Exact URL search ===")
r4 = pg(f"SELECT COUNT(*) FROM \"ProductImages\" WHERE \"ImageUrl\" = '{OLD_URL}';")
print(f"Exact match: {r4}")

# Check Products for any image-like columns
print("\n=== Products sutunlari (tam liste) ===")
cols = pg("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='Products' ORDER BY ordinal_position;")
print(cols[:500])

# Find all URL-like columns in Products
print("\n=== Products URL column search ===")
r5 = pg("SELECT column_name FROM information_schema.columns WHERE table_name='Products' AND (column_name ILIKE '%url%' OR column_name ILIKE '%image%');")
print(r5)

client.close()
