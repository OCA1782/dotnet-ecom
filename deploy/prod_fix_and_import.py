# -*- coding: utf-8 -*-
"""
1. docker-compose.yml çakışmasını çöz (git checkout)
2. git pull
3. Sadece API rebuild + restart
4. Migration uygula (otomatik: startup'ta çalışır)
5. Kimlik doğrula
6. Kaynakları listele + import tetikle
7. DB ürün sayısını kontrol et
8. FE restart
"""
import os, sys, time, json
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
ADMIN_PASS = "Hl1PV64T@%y#aTqzzl#G2tLe"
EMAIL = "admin@ecom.com"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"SSH → {HOST}")
client.connect(HOST, username=USER, password=PASS, timeout=20)

def run(cmd, timeout=300):
    _, out, err = client.exec_command(cmd, timeout=timeout)
    return (out.read().decode('utf-8', errors='replace') + err.read().decode('utf-8', errors='replace')).strip()

def run_stream(cmd, timeout=600):
    """Print output as it comes (for long commands)"""
    chan = client.get_transport().open_session()
    chan.exec_command(cmd)
    chan.settimeout(timeout)
    buf = ""
    while True:
        if chan.recv_ready():
            data = chan.recv(4096).decode('utf-8', errors='replace')
            buf += data
            for line in data.splitlines():
                print(f"  {line}")
        elif chan.exit_status_ready():
            break
        else:
            time.sleep(0.5)
    return buf

sa_pass = run("grep SA_PASSWORD /opt/ecom/.env | cut -d= -f2-")

# ── DB: tüm veritabanları ─────────────────────────────────────────────────────
print("\n[DB] Veritabanları ve ürün sayısı...")
dbs = run(f"docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '{sa_pass}' -C -Q \"SELECT name FROM sys.databases WHERE name NOT IN ('master','tempdb','model','msdb')\" 2>&1")
print(f"  Veritabanları: {dbs}")

sql = f"""docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '{sa_pass}' -C -d EcomDb -Q \
  "SELECT 'Aktif' as Durum, COUNT(*) as Sayi FROM Products WHERE IsDeleted=0
   UNION ALL SELECT 'Silinmis', COUNT(*) FROM Products WHERE IsDeleted=1
   UNION ALL SELECT 'Toplam', COUNT(*) FROM Products" 2>&1"""
print(f"  {run(sql, timeout=30)}")

# ── 1. docker-compose.yml çakışmasını çöz ─────────────────────────────────────
print("\n[1/5] docker-compose.yml çakışması çözülüyor...")
print(f"  {run('cd /opt/ecom && git checkout docker-compose.yml 2>&1')}")

print("\n[1b/5] git pull...")
pull_out = run("cd /opt/ecom && git pull origin main 2>&1", timeout=60)
print(f"  {pull_out[:400]}")

# ── 2. rebuild API ─────────────────────────────────────────────────────────────
print("\n[2/5] API rebuild (ImportBatchProcessor fix)...")
build_out = run("cd /opt/ecom && docker compose build api 2>&1 | tail -8", timeout=720)
print(f"  {build_out}")

print("\n[2b/5] API restart...")
up_out = run("cd /opt/ecom && docker compose up -d api 2>&1", timeout=120)
print(f"  {up_out[-300:]}")

# ── 3. wait for API (daha uzun bekle — migration için) ────────────────────────
print("\n[3/5] API sağlık kontrolü (migration dahil ~2-3 dk)...")
for i in range(60):
    health = run("curl -sf http://localhost:5124/health -o /dev/null -w '%{http_code}'", timeout=15)
    if health.strip() == "200":
        print(f"  ✓ API sağlıklı ({i*5}s sonra)")
        break
    if i % 6 == 0:
        print(f"  bekliyor ({i*5}s)...")
    time.sleep(5)
else:
    print("  ✗ API 5 dakikada sağlıklı hale gelmedi")
    client.close(); sys.exit(1)

time.sleep(5)

# ── 4. auth ────────────────────────────────────────────────────────────────────
print("\n[4/5] Kimlik doğrulama...")
auth_raw = run(f"""curl -s -X POST http://localhost:5124/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{{"email":"{EMAIL}","password":"{ADMIN_PASS}"}}' 2>&1""", timeout=30)
print(f"  Yanıt: {auth_raw[:200]}")
try:
    auth_json = json.loads(auth_raw)
    token = auth_json.get("token", "")
except Exception:
    token = ""

if not token:
    print("  ✗ Token alınamadı. admin panel'den manuel import yapın.")
    client.close(); sys.exit(1)
print(f"  ✓ Token alındı")

# ── Kaynaklar ─────────────────────────────────────────────────────────────────
sources_raw = run(f"curl -s http://localhost:5124/api/admin/external-sources -H 'Authorization: Bearer {token}' 2>&1")
try:
    sources = json.loads(sources_raw)
except Exception:
    sources = []
    print(f"  Kaynaklar: {sources_raw[:300]}")

print(f"\n  {len(sources)} kaynak:")
for s in sources:
    print(f"    [{s['id']}] {s['name']} | {s['type']} | aktif={s['isActive']} | son_çekim={s.get('lastFetchedCount','-')} satır")

# ── 5. Import tetikle ─────────────────────────────────────────────────────────
print("\n[5/5] Import...")
active = [s for s in sources if s['isActive']]
if not active:
    print("  Aktif kaynak yok. Admin panel'den manuel yapın.")
    client.close(); sys.exit(0)

job_ids = []
for s in active:
    sid, name, stype = s['id'], s['name'], s['type']
    print(f"\n  → {name} ({stype})")

    # Son import'tan field mapping al
    logs_raw = run(f"curl -s 'http://localhost:5124/api/admin/external-sources/{sid}/logs' -H 'Authorization: Bearer {token}' 2>&1 | head -c 8000")
    field_mapping = {}
    try:
        logs = json.loads(logs_raw)
        items = logs if isinstance(logs, list) else logs.get("items", logs.get("data", []))
        for item in items:
            if item.get("fieldMappingJson"):
                field_mapping = json.loads(item["fieldMappingJson"])
                print(f"    Alan eşlemesi: {len(field_mapping)} alan — {list(field_mapping.keys())[:5]}")
                break
    except Exception as e:
        print(f"    Alan eşlemesi alınamadı: {e}")

    body_str = json.dumps({
        "targetEntity": "Product",
        "fieldMapping": field_mapping,
        "conflictStrategy": "update",
        "syncDelete": False
    }).replace("'", "'\\''")

    result_raw = run(f"""curl -s -X POST 'http://localhost:5124/api/admin/external-sources/{sid}/fetch-and-import' \
      -H 'Authorization: Bearer {token}' \
      -H 'Content-Type: application/json' \
      -d '{body_str}' 2>&1""", timeout=30)
    print(f"    fetch-and-import yanıtı: {result_raw[:400]}")
    try:
        res = json.loads(result_raw)
        job_id = res.get("jobId")
        if job_id:
            job_ids.append((name, job_id))
            print(f"    ✓ Job: {job_id}")
        else:
            print(f"    fetch-and-import başarısız, import-async deneniyor...")
            # Try import-async with preview data
            preview_raw = run(f"curl -s 'http://localhost:5124/api/admin/external-sources/{sid}/preview' -H 'Authorization: Bearer {token}' 2>&1 | head -c 200")
            print(f"    Preview: {preview_raw[:100]}")
    except Exception as e:
        print(f"    Parse hatası: {e}")

# ── Poll ───────────────────────────────────────────────────────────────────────
if job_ids:
    print(f"\n  Job takip ediliyor ({len(job_ids)} iş)...")
    done = set()
    for _ in range(180):
        for name, jid in job_ids:
            if jid in done: continue
            st_raw = run(f"curl -s 'http://localhost:5124/api/admin/external-sources/import-jobs/{jid}' -H 'Authorization: Bearer {token}' 2>&1")
            try:
                st = json.loads(st_raw)
                status = st.get("status","?")
                ins = st.get("insertedCount",0); upd = st.get("updatedCount",0)
                skip = st.get("skippedCount",0); proc = st.get("processedRows",0); total_r = st.get("totalRows",0)
                print(f"  [{name}] {status} | {proc}/{total_r} satır | +{ins} ↺{upd} ⊘{skip}")
                if status in ("Completed","Failed","Cancelled"):
                    done.add(jid)
                    if st.get("errorMessage"): print(f"    Hata: {st['errorMessage'][:300]}")
            except Exception as e:
                print(f"  [{name}] hata: {e}")
        if len(done) == len(job_ids): break
        time.sleep(10)

# ── Sonuç: DB ürün sayısı ─────────────────────────────────────────────────────
print("\n[Sonuç] DB ürün sayısı...")
sql2 = f"""docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '{sa_pass}' -C -d EcomDb -Q \
  "SELECT 'Aktif' as Durum, COUNT(*) as Sayi FROM Products WHERE IsDeleted=0
   UNION ALL SELECT 'Silinmis', COUNT(*) FROM Products WHERE IsDeleted=1
   UNION ALL SELECT 'Toplam', COUNT(*) FROM Products" 2>&1"""
print(run(sql2, timeout=30))

# ── FE restart ────────────────────────────────────────────────────────────────
print("\n[FE] Restart...")
print(run("cd /opt/ecom && docker compose restart customer admin 2>&1", timeout=120))

client.close()
print("\n✓ Tamamlandı!")
