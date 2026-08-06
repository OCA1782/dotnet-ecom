# -*- coding: utf-8 -*-
"""
r2_migration_server.py'yi sunucuya kopyalar ve nohup ile çalıştırır.
Migration sunucunun datacenter bant genişliğiyle çalışır — çok daha hızlı.

Kullanım:
  python deploy/ssh_run_r2_migration.py
"""
import os, sys, time
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

# 1. Script'i sunucuya kopyala
print("=== 1. Migration script sunucuya kopyalanıyor ===")
script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'r2_migration_server.py')
sftp = client.open_sftp()
sftp.put(script_path, '/tmp/r2_migration_server.py')
sftp.close()
print("Kopyalandı: /tmp/r2_migration_server.py")

# 2. Mevcut migration process'i durdur (varsa)
print("\n=== 2. Önceki migration durduruyuor (varsa) ===")
print(run("pkill -f r2_migration_server.py || true"))

# 3. Postgres bilgilerini oku
pg_user = run("grep '^POSTGRES_USER=' /opt/ecom/.env | cut -d= -f2-").strip() or 'ecom'
pg_db   = run("grep '^POSTGRES_DB=' /opt/ecom/.env | cut -d= -f2-").strip() or 'EcomDb'
print(f"Postgres: user={pg_user}, db={pg_db}")

# 4. nohup ile başlat
env_str = (
    f"R2_ACCOUNT_ID='{R2_ACCOUNT_ID}' "
    f"R2_ACCESS_KEY_ID='{R2_ACCESS_KEY_ID}' "
    f"R2_SECRET_ACCESS_KEY='{R2_SECRET_KEY}' "
    f"R2_BUCKET='{R2_BUCKET}' "
    f"R2_PUBLIC_URL='{R2_PUBLIC_URL}' "
    f"POSTGRES_USER='{pg_user}' "
    f"POSTGRES_DB='{pg_db}' "
)
print("\n=== 3. Migration başlatılıyor (nohup) ===")
start_cmd = f"nohup env {env_str} python3 /tmp/r2_migration_server.py > /tmp/r2_migration.log 2>&1 &"
run(start_cmd, timeout=10)
time.sleep(3)

# 5. PID doğrula
pid = run("pgrep -f r2_migration_server.py").strip()
if pid:
    print(f"Migration çalışıyor — PID: {pid}")
else:
    print("HATA: Migration başlamadı!")
    print(run("tail -20 /tmp/r2_migration.log"))
    client.close()
    sys.exit(1)

# 6. İlk 15 saniye log
print("\nİlk çıktı (15s):")
time.sleep(15)
print(run("tail -10 /tmp/r2_migration.log"))

print(f"""
=== MIGRATION ARKA PLANDA ÇALIŞIYOR ===
PID       : {pid}
Log       : /tmp/r2_migration.log
İlerleme  : /tmp/r2_migration_progress.txt
Hatalar   : /tmp/r2_migration_errors.log

Durumu izlemek için:
  python deploy/ssh_migration_status.py
""")
client.close()
