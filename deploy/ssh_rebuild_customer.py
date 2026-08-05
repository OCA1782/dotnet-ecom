# -*- coding: utf-8 -*-
"""
Sunucuda git pull + docker build + customer container yeniden baslat.
Mevcut ecom-customer-1 container'ini gunceller; docker-compose'a dokunmaz.

KRITIK: Her rebuild'de CustomerTemplate DB'den okunur ve NEXT_PUBLIC_FALLBACK_TEMPLATE
olarak container'a gecilir. Boylece API gecikmeli/hata durumunda sablon kaybolmaz.
"""
import os, sys, time
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def read_env_var(var):
    return run(f"grep '^{var}=' /opt/ecom/.env | cut -d= -f2-").strip()

# 1. Git pull
print("=== 1. Git pull ===")
print(run("cd /opt/ecom && git fetch origin main && git reset --hard origin/main 2>&1", timeout=60))

# 2. DB'den aktif CustomerTemplate oku (kritik: deploy sonrasi sablon kaymasin)
PG_USER = read_env_var('POSTGRES_USER') or 'ecom'
PG_DB   = read_env_var('POSTGRES_DB') or 'EcomDb'
print("\n=== 2. Aktif template DB'den okunuyor ===")
import tempfile, io

sftp = client.open_sftp()
with sftp.open('/tmp/get_template.sql', 'w') as f:
    f.write('SELECT "Value" FROM "SiteSettings" WHERE "Key" = \'CustomerTemplate\';\n')
sftp.close()

tmpl_out = run(
    f'docker exec -i ecom-postgres-1 psql -U {PG_USER} -d {PG_DB} < /tmp/get_template.sql 2>&1',
    timeout=15
)

# psql output ornegi:
#    Value
# -----------
#  spareparts
# (1 row)
active_template = "modern"  # guvenli varsayilan
for line in tmpl_out.splitlines():
    stripped = line.strip()
    if stripped and stripped != "Value" and not stripped.startswith("-") and not stripped.startswith("("):
        active_template = stripped
        break

print(f"Aktif template: '{active_template}'")

# 3. Env degiskenlerini oku
site_url    = read_env_var('NEXT_PUBLIC_SITE_URL') or 'http://31.210.40.242:13000'
api_url     = read_env_var('NEXT_PUBLIC_API_URL')  or 'http://31.210.40.242:15124'
google_cid  = read_env_var('NEXT_PUBLIC_GOOGLE_CLIENT_ID') or ''

network_name = run(
    "docker inspect ecom-api-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'",
    timeout=10
).strip() or 'ecom_default'

# 4. Docker build
print(f"\n=== 3. Docker build (ecom-customer-new:latest) ===")
build_out = run(
    f"docker build "
    f"--build-arg NEXT_PUBLIC_API_URL={api_url} "
    f"--build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID={google_cid} "
    f"-t ecom-customer-new:latest "
    f"/opt/ecom/frontend/customer 2>&1",
    timeout=900
)
last_lines = '\n'.join(build_out.splitlines()[-20:])
print(last_lines)

build_failed = (
    'error' in build_out.lower()
    and 'successfully built' not in build_out.lower()
    and 'writing image' not in build_out.lower()
)
if build_failed:
    print("\nBuild BASARISIZ — cikiliyor")
    client.close()
    sys.exit(1)
print("Build tamamlandi.")

# 5. Eski container'i durdur
print("\n=== 4. Eski ecom-customer-1 durduruluyor ===")
print(run("docker stop ecom-customer-1 && docker rm ecom-customer-1 || true", timeout=30))

# 6. Yeni container baslat
print("\n=== 5. Yeni ecom-customer-1 baslatiliyor ===")
run_cmd = (
    f"docker run -d --name ecom-customer-1 "
    f"--network {network_name} "
    f"--restart unless-stopped "
    f"-p 13000:3000 "
    f"-e NODE_ENV=production "
    f"-e NEXT_TELEMETRY_DISABLED=1 "
    f"-e PORT=3000 "
    f"-e HOSTNAME=0.0.0.0 "
    f"-e NEXT_PUBLIC_API_URL={api_url} "
    f"-e NEXT_PUBLIC_SITE_URL={site_url} "
    f"-e INTERNAL_API_URL=http://ecom-api-1:8080 "
    f"-e NEXT_PUBLIC_FALLBACK_TEMPLATE={active_template} "
    f"-e NEXT_PUBLIC_GOOGLE_CLIENT_ID={google_cid} "
    f"ecom-customer-new:latest"
)
result = run(run_cmd, timeout=30)
print(f"Container: {result[:24]}...")

# 7. Baslamasini bekle ve dogrula
print("\nCustomer baslamasini bekleniyor...")
for i in range(12):
    time.sleep(5)
    status = run("docker inspect ecom-customer-1 --format '{{.State.Status}}' 2>/dev/null").strip()
    http   = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:13000/ 2>/dev/null").strip()
    print(f"  {(i+1)*5}s: container={status} http={http}")
    if http == '200':
        print("Customer hazir!")
        break
    if status in ('exited', 'dead'):
        print("  --- CRASH LOGS ---")
        print(run("docker logs ecom-customer-1 --tail 20 2>&1", timeout=10))
        break

# 8. Template dogrulama
print("\n=== 6. Template dogrulama ===")
html_check = run("curl -s http://localhost:13000/ | grep data-template | head -c 300 2>/dev/null", timeout=15)
import re
m = re.search(r'data-template="([^"]+)"', html_check)
if m:
    found = m.group(1)
    ok = "OK" if found == active_template else "HATA"
    print(f"Rendered template: '{found}' — {ok} (beklenen: '{active_template}')")
else:
    print("data-template bulunamadi — HTML kontrolu basarisiz")

print("\n=== Container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=15))

client.close()
print("\n=== TAMAMLANDI ===")
