# -*- coding: utf-8 -*-
"""
1. no-image.png'yi R2'ye yükler, API ve frontend referanslarını günceller.
2. Sunucudaki /uploads/ klasörünü listeler.

Kullanım:
  python deploy/ssh_noimage_and_uploads.py
"""
import os, sys, io
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
R2_PUBLIC_URL = os.environ['R2_PUBLIC_URL'].rstrip('/')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

# 1. no-image.png nerede?
print("=== 1. no-image.png konumu ===")
result = run("find /opt/ecom -name '*no-image*' 2>/dev/null; find /var/www -name '*no-image*' 2>/dev/null || true")
print(result or "(bulunamadı)")

# 2. Backend uploads klasörü
print("\n=== 2. Backend /uploads/ içeriği ===")
uploads_list = run("find /opt/ecom -path '*/uploads/*' -type f 2>/dev/null | head -50")
print(uploads_list or "(bulunamadı)")

# 3. Uploads klasörü boyutu ve dosya sayısı
print("\n=== 3. Uploads özet ===")
uploads_info = run("find /opt/ecom -name 'uploads' -type d 2>/dev/null")
for udir in uploads_info.splitlines():
    udir = udir.strip()
    if udir:
        count = run(f"find '{udir}' -type f | wc -l")
        size  = run(f"du -sh '{udir}' 2>/dev/null || echo '?'")
        print(f"  {udir}: {count} dosya, {size.split()[0] if size else '?'}")

client.close()
