# -*- coding: utf-8 -*-
"""
1. git pull prod
2. rebuild + restart API only (apply ImportBatchProcessor fix)
3. authenticate
4. DB ürün sayısı + kaynak listesi
5. CatalogIQ için fetch-and-import tetikle
6. Poll job status
7. Restart FE containers
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

HOST = os.environ['DEPLOY_SSH_HOST']
USER = os.environ['DEPLOY_SSH_USER']
PASS = os.environ['DEPLOY_SSH_PASSWORD']
API = f"http://{HOST}:5124"
EMAIL = "admin@ecom.com"
ADMIN_PASS = "Hl1PV64T@%y#aTqzzl#G2tLe"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"SSH → {HOST}")
client.connect(HOST, username=USER, password=PASS, timeout=20)

def run(cmd, timeout=300):
    _, out, err = client.exec_command(cmd, timeout=timeout)
    return (out.read().decode('utf-8', errors='replace') + err.read().decode('utf-8', errors='replace')).strip()

def api_call(method, path, body=None, token=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode('utf-8', errors='replace')
        return e.code, body_txt

# ── DB: ürün sayısı ────────────────────────────────────────────────────────────
print("\n[DB] Ürün sayısı kontrol ediliyor...")
sa_pass = run("grep SA_PASSWORD /opt/ecom/.env | cut -d= -f2-")
db_name = run(f"docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '{sa_pass}' -C -Q \"SELECT name FROM sys.databases\" 2>&1 | grep -i ecom | head -3")
print(f"  DB ismi: {db_name}")

sql = f"""docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '{sa_pass}' -C -d EcomDb -Q \
  "SELECT 'Aktif' as Durum, COUNT(*) as Sayi FROM Products WHERE IsDeleted=0
   UNION ALL SELECT 'Silinmis', COUNT(*) FROM Products WHERE IsDeleted=1
   UNION ALL SELECT 'Toplam', COUNT(*) FROM Products" 2>&1"""
sql_out = run(sql, timeout=30)
print(f"  {sql_out}")

# ── 1. git pull ────────────────────────────────────────────────────────────────
print("\n[1/5] git pull...")
git_out = run("cd /opt/ecom && git pull origin main 2>&1", timeout=60)
print(f"  {git_out[:300]}")

# ── 2. rebuild + restart API ───────────────────────────────────────────────────
print("\n[2/5] API container rebuild (ImportBatchProcessor fix içeriyor)...")
print("  (Bu ~5-8 dk sürebilir, bekleniyor...)")
build_out = run("cd /opt/ecom && docker compose build api 2>&1 | tail -10", timeout=720)
print(f"  {build_out}")

print("\n[2b/5] API restart...")
up_out = run("cd /opt/ecom && docker compose up -d api 2>&1", timeout=60)
print(f"  {up_out}")

# ── 3. wait for API ────────────────────────────────────────────────────────────
print("\n[3/5] API sağlık kontrolü...")
for i in range(36):
    health = run(f"curl -sf http://localhost:5124/health -o /dev/null -w '%{{http_code}}'", timeout=15)
    if health.strip() == "200":
        print(f"  ✓ API sağlıklı ({i*5}s sonra)")
        break
    print(f"  bekliyor ({i+1}/36)...")
    time.sleep(5)
else:
    print("  ✗ API 3 dakikada sağlıklı hale gelmedi")
    client.close()
    sys.exit(1)

time.sleep(3)

# ── 4. authenticate ────────────────────────────────────────────────────────────
print("\n[4/5] Kimlik doğrulama...")
# Try both direct HTTP and through SSH curl
auth_result = run(f"""curl -s -X POST http://localhost:5124/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{{"email":"{EMAIL}","password":"{ADMIN_PASS}"}}' 2>&1""")
try:
    auth_json = json.loads(auth_result)
    token = auth_json.get("token", "")
except Exception:
    token = ""
    print(f"  Auth yanıtı: {auth_result[:200]}")

if not token:
    print("  ✗ Token alınamadı")
    client.close()
    sys.exit(1)
print(f"  ✓ Token alındı: {token[:40]}...")

# ── Kaynaklar ─────────────────────────────────────────────────────────────────
sources_json = run(f"""curl -s http://localhost:5124/api/admin/external-sources \
  -H 'Authorization: Bearer {token}' 2>&1""")
try:
    sources = json.loads(sources_json)
except Exception:
    sources = []
    print(f"  Kaynaklar: {sources_json[:200]}")

print(f"\n  {len(sources)} dış kaynak:")
for s in sources:
    print(f"    [{s['id']}] {s['name']} | {s['type']} | aktif={s['isActive']} | son={s.get('lastFetchedCount','-')} satır")

# ── 5. Import tetikle ─────────────────────────────────────────────────────────
print("\n[5/5] Import tetikleniyor...")
active = [s for s in sources if s['isActive']]
if not active:
    print("  Aktif kaynak bulunamadı!")
    client.close()
    sys.exit(0)

job_ids = []
for s in active:
    sid = s['id']
    name = s['name']
    stype = s['type']
    print(f"\n  → {name} ({stype})")

    # For fetch-and-import, we need the field mapping.
    # Try to get existing field mapping from last import log
    logs_json = run(f"""curl -s "http://localhost:5124/api/admin/external-sources/{sid}/logs" \
      -H 'Authorization: Bearer {token}' 2>&1 | head -c 5000""")
    try:
        logs = json.loads(logs_json)
        last_mapping = None
        if isinstance(logs, list) and logs:
            last_mapping = logs[0].get("fieldMappingJson")
        elif isinstance(logs, dict):
            items = logs.get("items", logs.get("data", []))
            if items:
                last_mapping = items[0].get("fieldMappingJson")
    except Exception:
        last_mapping = None

    if last_mapping:
        try:
            field_mapping = json.loads(last_mapping)
            print(f"    Son import'tan alan eşlemesi alındı: {len(field_mapping)} alan")
        except Exception:
            field_mapping = {}
    else:
        print(f"    Alan eşlemesi bulunamadı, boş mapping ile deneniyor")
        field_mapping = {}

    # Trigger fetch-and-import (server-side fetches all pages, then imports)
    body = json.dumps({
        "targetEntity": "Product",
        "fieldMapping": field_mapping,
        "conflictStrategy": "update",
        "syncDelete": False
    })
    result = run(f"""curl -s -X POST "http://localhost:5124/api/admin/external-sources/{sid}/fetch-and-import" \
      -H 'Authorization: Bearer {token}' \
      -H 'Content-Type: application/json' \
      -d '{body}' 2>&1""")
    print(f"    Yanıt: {result[:300]}")
    try:
        res_json = json.loads(result)
        job_id = res_json.get("jobId")
        if job_id:
            job_ids.append((name, job_id))
            print(f"    ✓ Job kuyruğa alındı: {job_id}")
    except Exception:
        pass

# ── Poll job status ────────────────────────────────────────────────────────────
if job_ids:
    print(f"\n  {len(job_ids)} job takip ediliyor (max 30 dk)...")
    completed = set()
    for attempt in range(180):
        for name, jid in job_ids:
            if jid in completed:
                continue
            status_result = run(f"""curl -s "http://localhost:5124/api/admin/external-sources/import-jobs/{jid}" \
              -H 'Authorization: Bearer {token}' 2>&1""")
            try:
                st = json.loads(status_result)
                status = st.get("status", "?")
                pct = st.get("processedRows", 0)
                total_rows = st.get("totalRows", 0)
                inserted = st.get("insertedCount", 0)
                updated = st.get("updatedCount", 0)
                skipped = st.get("skippedCount", 0)
                print(f"    [{name}] {status} — {pct}/{total_rows} satır | +{inserted} eklendi | ↺{updated} güncellendi | ⊘{skipped} atlandı")
                if status in ("Completed", "Failed", "Cancelled"):
                    completed.add(jid)
                    if st.get("errorMessage"):
                        print(f"      Hata: {st['errorMessage'][:200]}")
            except Exception as e:
                print(f"    [{name}] durum alınamadı: {e}")
        if len(completed) == len(job_ids):
            break
        time.sleep(10)

# ── DB ürün sayısı sonuç ───────────────────────────────────────────────────────
print("\n[Son] DB ürün sayısı...")
sql_out2 = run(f"""docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '{sa_pass}' -C -d EcomDb -Q \
  "SELECT 'Aktif' as Durum, COUNT(*) as Sayi FROM Products WHERE IsDeleted=0
   UNION ALL SELECT 'Silinmis', COUNT(*) FROM Products WHERE IsDeleted=1
   UNION ALL SELECT 'Toplam', COUNT(*) FROM Products" 2>&1""", timeout=30)
print(sql_out2)

# ── FE restart ────────────────────────────────────────────────────────────────
print("\n[FE] Customer + Admin restart...")
fe_out = run("cd /opt/ecom && docker compose restart customer admin 2>&1", timeout=120)
print(fe_out)

client.close()
print("\n✓ Tamamlandı!")
