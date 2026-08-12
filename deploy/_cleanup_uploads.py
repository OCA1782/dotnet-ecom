# -*- coding: utf-8 -*-
"""
Lists and deletes files in the server's wwwroot/uploads folder.
All product images have been migrated to R2 — local copies are no longer needed.
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

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

print("=== Sunucu uploads klasörü içeriği ===")
files = run("docker exec ecom-api-1 find /app/wwwroot/uploads -type f 2>/dev/null | head -30 && echo '---' && docker exec ecom-api-1 du -sh /app/wwwroot/uploads/ 2>/dev/null || echo 'Klasör bulunamadı veya boş'")
print(files)

print("\n=== Temizleniyor ===")
# Delete all files in uploads (product images already on R2)
result = run("docker exec ecom-api-1 find /app/wwwroot/uploads -type f -delete && echo 'Silindi' || echo 'Hata'")
print(result)

print("\n=== Sonraki durum ===")
after = run("docker exec ecom-api-1 find /app/wwwroot/uploads -type f 2>/dev/null | wc -l && echo 'dosya kaldı'")
print(after)

# Also check the Docker volume on the host
print("\n=== Docker uploads volume (host) ===")
vol_size = run("docker system df -v 2>/dev/null | grep -E 'uploads|Local Volume' | head -5 || echo 'N/A'")
print(vol_size)

client.close()
print("\n=== TAMAMLANDI ===")
