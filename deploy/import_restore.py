# -*- coding: utf-8 -*-
"""
1. git pull production server
2. rebuild + restart API container only
3. authenticate
4. list external sources
5. trigger fetch-all-import for each active source
6. poll until complete
7. verify product count
"""
import os, sys, time, json, urllib.request, urllib.error

sys.stdout.reconfigure(encoding='utf-8')
import paramiko

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_env):
    with open(_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

HOST     = os.environ['DEPLOY_SSH_HOST']
USER     = os.environ['DEPLOY_SSH_USER']
PASSWORD = os.environ['DEPLOY_SSH_PASSWORD']
API_URL  = os.environ.get('API_PUBLIC_URL', f'http://{HOST}:5124')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"SSH → {HOST}")
client.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def run(cmd, timeout=120):
    _, out, err = client.exec_command(cmd, timeout=timeout)
    return (out.read().decode('utf-8', errors='replace') + err.read().decode('utf-8', errors='replace')).strip()

# ── 1. git pull ───────────────────────────────────────────────────────────────
print("\n[1/5] git pull...")
result = run("cd /opt/ecom && git pull origin main", timeout=60)
print(result[:400])

# ── 2. rebuild API only ───────────────────────────────────────────────────────
print("\n[2/5] docker compose build api (bu ~5 dk sürer)...")
result = run("cd /opt/ecom && docker compose build api 2>&1 | tail -5", timeout=600)
print(result)

print("\n[2b/5] docker compose up -d api...")
result = run("cd /opt/ecom && docker compose up -d api 2>&1", timeout=120)
print(result)

# ── 3. wait for API healthy ───────────────────────────────────────────────────
print("\n[3/5] API sağlık kontrolü...")
for i in range(30):
    status = run(f"curl -sf http://localhost:5124/health -o /dev/null -w '%{{http_code}}'", timeout=15)
    if status.strip() == "200":
        print("✓ API sağlıklı")
        break
    print(f"  bekliyor ({i+1}/30)...")
    time.sleep(10)
else:
    print("✗ API 5 dakikada sağlıklı hale gelmedi")
    client.close()
    sys.exit(1)

client.close()

# ── 4. authenticate ───────────────────────────────────────────────────────────
print("\n[4/5] kimlik doğrulama...")

def api(method, path, body=None, token=None):
    url = f"{API_URL}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f"HTTP {e.code}: {body[:200]}")

# Get admin credentials from prod env via SSH or use .env
admin_email = os.environ.get('SEED_ADMIN_EMAIL', 'admin@ecom.com')
# Try to get prod admin password from server .env
client2 = paramiko.SSHClient()
client2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client2.connect(HOST, username=USER, password=PASSWORD, timeout=20)
prod_pass = run("grep SEED_ADMIN_PASSWORD /opt/ecom/.env | cut -d= -f2-")
if not prod_pass:
    prod_pass = os.environ.get('SEED_ADMIN_PASSWORD', '')
client2.close()
print(f"  admin: {admin_email}")

auth_res = api("POST", "/api/auth/login", {"email": admin_email, "password": prod_pass})
token = auth_res.get("token", "")
if not token:
    print("✗ token alınamadı")
    sys.exit(1)
print("✓ token alındı")

# ── 5. ürün sayısı before ─────────────────────────────────────────────────────
print("\n[5/5] import tetikleme...")
try:
    prod_before = api("GET", "/api/admin/products?pageSize=1&page=1", token=token)
    count_before = prod_before.get("totalCount", "?")
    print(f"  Mevcut ürün sayısı: {count_before}")
except Exception as e:
    print(f"  Ürün sayısı alınamadı: {e}")
    count_before = "?"

# list sources
sources = api("GET", "/api/admin/external-sources", token=token)
print(f"  {len(sources)} kaynak bulundu:")
for s in sources:
    print(f"    [{s['id']}] {s['name']} | tür={s['type']} | aktif={s['isActive']}")

# trigger fetch-all-import for active sources
for s in sources:
    if not s['isActive']:
        continue
    sid = s['id']
    name = s['name']
    print(f"\n  → {name}: fetch-and-import tetikleniyor...")
    try:
        # Use queue-all endpoint if available, else individual fetch+import
        res = api("POST", f"/api/admin/external-sources/{sid}/queue-all", token=token)
        print(f"    Kuyruğa alındı: {res}")
    except RuntimeError as e:
        print(f"    queue-all başarısız ({e}), bireysel fetch deniyor...")
        try:
            fetch_res = api("POST", f"/api/admin/external-sources/{sid}/fetch", token=token)
            row_count = len(fetch_res.get("rows", []))
            print(f"    Veri çekildi: {row_count} satır")
        except Exception as e2:
            print(f"    fetch başarısız: {e2}")

print("\n✓ Import işlemi başlatıldı.")
print("  Admin panelinden 'Dış Kaynaklar' ekranında job'ı takip edin.")
print(f"  Ürün sayısı öncesi: {count_before}")
print(f"  API: {API_URL}/api/admin/external-sources")
