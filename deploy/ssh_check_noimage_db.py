# -*- coding: utf-8 -*-
"""DB'deki no-image URL'lerini kontrol eder ve R2 URL ile günceller."""
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
R2_NO_IMAGE = "https://images.autoforcepart.com/static/autoforcepart-no-image.png"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def pg(sql):
    """stdin üzerinden SQL gönderir - tırnak sorununu önler."""
    stdin, stdout, stderr = client.exec_command(
        'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t -F"|"',
        timeout=60
    )
    stdin.write(sql + '\n')
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

# 1. ProductImages'ta kaç tane no-image var?
count_pi = pg('SELECT COUNT(*) FROM "ProductImages" WHERE "ImageUrl" LIKE \'%no-image%\';')
print(f"ProductImages (no-image): {count_pi}")

# 2. Products tablosundaki image sütunları
cols = pg("SELECT column_name FROM information_schema.columns WHERE table_name='Products' AND column_name ILIKE '%image%';")
print(f"Products image sutunlari: {cols}")

# 3. Örnek URL'ler
samples = pg('SELECT DISTINCT "ImageUrl" FROM "ProductImages" WHERE "ImageUrl" LIKE \'%no-image%\' LIMIT 10;')
print(f"Ornek URL\'ler:\n{samples}")

# 4. Products tablosundaki image sütunu
prod_img_col = pg("SELECT column_name FROM information_schema.columns WHERE table_name='Products' AND column_name ILIKE '%image%';")
for col in [c.strip() for c in prod_img_col.splitlines() if c.strip()]:
    cnt = pg(f'SELECT COUNT(*) FROM "Products" WHERE "{col}" LIKE \'%no-image%\';')
    print(f'Products."{col}" (no-image): {cnt}')

client.close()
