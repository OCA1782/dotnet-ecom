# -*- coding: utf-8 -*-
"""DB'deki autoforcepart.com no-image URL'lerini R2 URL'siyle gunceller."""
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

OLD_URL = 'https://www.autoforcepart.com/autoforcepart-no-image.png'
NEW_URL = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

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

print("=== ProductImages count ===")
count = pg(f"SELECT COUNT(*) FROM \"ProductImages\" WHERE \"ImageUrl\" = '{OLD_URL}';")
print(f"Kayit sayisi: {count.strip()}")

if count.strip() not in ('0', ''):
    print("Guncelleniyor...")
    result = pg(f"UPDATE \"ProductImages\" SET \"ImageUrl\" = '{NEW_URL}' WHERE \"ImageUrl\" = '{OLD_URL}';")
    print(f"Sonuc: {result}")
    verify = pg(f"SELECT COUNT(*) FROM \"ProductImages\" WHERE \"ImageUrl\" = '{OLD_URL}';")
    print(f"Kalan eski URL: {verify.strip()}")
else:
    print("Guncellenecek kayit yok (ProductImages).")

# Diger tablolar
print("\n=== Diger tablolarda arama ===")
for tbl, col in [('Products', 'ImageUrl'), ('AiTaskImages', 'ImageUrl')]:
    try:
        cnt = pg(f"SELECT COUNT(*) FROM \"{tbl}\" WHERE \"{col}\" = '{OLD_URL}';")
        print(f"{tbl}.{col}: {cnt.strip()}")
        if cnt.strip() not in ('0', ''):
            pg(f"UPDATE \"{tbl}\" SET \"{col}\" = '{NEW_URL}' WHERE \"{col}\" = '{OLD_URL}';")
            print(f"  -> Guncellendi")
    except Exception as e:
        print(f"{tbl}.{col}: hata - {e}")

client.close()
print("Tamamlandi.")
