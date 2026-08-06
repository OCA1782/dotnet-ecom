# -*- coding: utf-8 -*-
"""
Sunucudaki /opt/ecom/.env dosyasına R2 kimlik bilgilerini ekler,
ardından API'yi yeniden build edip başlatır.

Kullanım:
  export DEPLOY_SSH_HOST=...
  export DEPLOY_SSH_USER=...
  export DEPLOY_SSH_PASSWORD=...
  export R2_ACCOUNT_ID=...
  export R2_ACCESS_KEY_ID=...
  export R2_SECRET_ACCESS_KEY=...
  export R2_BUCKET=...
  export R2_PUBLIC_URL=...
  python deploy/ssh_set_r2_env.py
"""
import os, sys, time
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

# SSH bilgilerini yerel .env dosyasından da okuyabilir
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

R2_ACCOUNT_ID    = os.environ['R2_ACCOUNT_ID']
R2_ACCESS_KEY_ID = os.environ['R2_ACCESS_KEY_ID']
R2_SECRET_KEY    = os.environ['R2_SECRET_ACCESS_KEY']
R2_BUCKET        = os.environ['R2_BUCKET']
R2_PUBLIC_URL    = os.environ['R2_PUBLIC_URL']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

ENV_FILE = '/opt/ecom/.env'

def set_env_var(key, value):
    """Var olan satırı günceller, yoksa ekler."""
    # Önce mevcut satırı sil
    run(f"sed -i '/^{key}=/d' {ENV_FILE}")
    # Sona ekle
    run(f"echo '{key}={value}' >> {ENV_FILE}")

print("=== 1. Sunucu .env güncelleniyor ===")
set_env_var('R2_ACCOUNT_ID',     R2_ACCOUNT_ID)
set_env_var('R2_ACCESS_KEY_ID',  R2_ACCESS_KEY_ID)
set_env_var('R2_SECRET_ACCESS_KEY', R2_SECRET_KEY)
set_env_var('R2_BUCKET',         R2_BUCKET)
set_env_var('R2_PUBLIC_URL',     R2_PUBLIC_URL)
print("R2 değerleri .env'e yazıldı.")

# Doğrula (değerleri göstermeden)
check = run(f"grep '^R2_' {ENV_FILE} | cut -d= -f1")
print(f"Eklenen anahtarlar: {check.replace(chr(10), ', ')}")

print("\n=== 2. Git pull ===")
print(run("cd /opt/ecom && git pull origin main 2>&1", timeout=60))

print("\n=== 3. API build ===")
build = run("cd /opt/ecom && docker compose build api 2>&1 | tail -25", timeout=900)
print(build)

if 'error' in build.lower() and 'successfully' not in build.lower() and 'writing image' not in build.lower():
    print("\nBuild BASARISIZ — çıkılıyor")
    client.close()
    sys.exit(1)

print("\n=== 4. API yeniden başlatılıyor ===")
print(run("cd /opt/ecom && docker compose up -d api 2>&1", timeout=60))

print("\nBekleniyor (40s)...")
time.sleep(40)

print("\n=== 5. Container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=15))

print("\n=== 6. API health ===")
print(run("curl -s http://localhost:15124/health 2>/dev/null", timeout=15))

client.close()
print("\n=== TAMAMLANDI ===")
print("Sıradaki adım: python deploy/migrate_images_to_r2.py")
