# -*- coding: utf-8 -*-
"""
DB'deki autoforcepart-no-image.png URL'lerini R2 URL'siyle günceller.
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

R2_NO_IMAGE = "https://images.autoforcepart.com/static/autoforcepart-no-image.png"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def pg(sql, timeout=30):
    cmd = f"docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t -c \"{sql}\""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

# Kaç kayıt var?
print("=== Mevcut no-image kayıtları ===")
count_result = pg("SELECT COUNT(*) FROM \\\"ProductImages\\\" WHERE \\\"ImageUrl\\\" LIKE '%autoforcepart-no-image%';")
print(f"ProductImages: {count_result}")

count_prod = pg("SELECT COUNT(*) FROM \\\"Products\\\" WHERE \\\"ImageUrl\\\" LIKE '%autoforcepart-no-image%';")
print(f"Products (ImageUrl): {count_prod}")

# Örnek URL'leri gör
print("\n=== Örnek no-image URL'leri ===")
samples = pg("SELECT DISTINCT \\\"ImageUrl\\\" FROM \\\"ProductImages\\\" WHERE \\\"ImageUrl\\\" LIKE '%autoforcepart-no-image%' LIMIT 10;")
print(samples)

samples_prod = pg("SELECT DISTINCT \\\"ImageUrl\\\" FROM \\\"Products\\\" WHERE \\\"ImageUrl\\\" LIKE '%autoforcepart-no-image%' LIMIT 5;")
print(samples_prod)

client.close()
