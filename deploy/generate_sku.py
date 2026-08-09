# -*- coding: utf-8 -*-
"""
SKU'suz ürünler için AFP-{BRAND4}-{HASH8} formatında SKU üretir.
LOCAL ve SERVER DB ayrı ayrı işlenir.

Format:
  - Barcode varsa   : {BARCODE} veya {BARCODE}-{BRAND4}
  - Brand + Vehicle : AFP-{B4}-{V3}-{H6}
  - Sadece Brand    : AFP-{B4}-{H8}
  - Brand de yok    : AFP-{H10}

Hash: MD5(product_id) — aynı ürün her zaman aynı SKU → stable & unique
BRAND4: marka adının ilk 4 ASCII büyük harfi (Türkçe dönüşümlü)
VEHICLE3: araç modelinden ilk anlamlı kelimenin ilk 3 büyük harfi

DRY_RUN = True  → üretilecek SKU örneklerini gösterir, DB'ye yazmaz
DRY_RUN = False → local + server DB'ye yazar

Akış:
  1. Local DB: psycopg2 ile doğrudan sorgula → SKU üret → local'e yaz
  2. Server DB: SSH -> psql \\COPY ile export CSV -> SFTP ile indir ->
               Python'da SKU üret → CSV upload → psql ile uygula
"""
import os, sys, io, csv, time, re, hashlib, paramiko, psycopg2, psycopg2.extras
sys.stdout.reconfigure(encoding='utf-8')

DRY_RUN = False

LOCAL_DSN = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(_env, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip()

SSH_HOST  = os.environ['DEPLOY_SSH_HOST']
SSH_USER  = os.environ['DEPLOY_SSH_USER']
SSH_PASS  = os.environ['DEPLOY_SSH_PASSWORD']
CONTAINER = 'ecom-postgres-1'
DB_USER   = 'ecom'
DB_NAME   = 'EcomDb'

STOP_WORDS = {'ve', 'ile', 'bir', 'bu', 'da', 'de', 'mi', 'mu', 'ya', 'ki'}

# ── SKU Yardımcı Fonksiyonları ────────────────────────────────────────────────

def to_ascii(s: str) -> str:
    tr = {'ğ':'g','Ğ':'G','ü':'u','Ü':'U','ş':'s','Ş':'S','ı':'i','İ':'I','ö':'o','Ö':'O','ç':'c','Ç':'C'}
    return ''.join(tr.get(c, c) for c in s)

def brand4(name: str | None) -> str | None:
    if not name:
        return None
    clean = re.sub(r'[^A-Za-z0-9]', '', to_ascii(name)).upper()
    return clean[:4] if clean else None

def vehicle3(model: str | None) -> str | None:
    if not model:
        return None
    words = [w for w in re.split(r'\W+', model) if w and w.lower() not in STOP_WORDS and len(w) >= 2]
    if not words:
        return None
    clean = re.sub(r'[^A-Za-z0-9]', '', to_ascii(words[0])).upper()
    return clean[:3] if clean else None

def make_hash(product_id: str, length: int) -> str:
    return hashlib.md5(product_id.encode()).hexdigest().upper()[:length]

def build_sku(pid: str, brand_name: str | None, vehicle_model: str | None, barcode: str | None) -> str:
    if barcode and barcode.strip():
        b = brand4(brand_name)
        return f"{barcode.strip()}-{b}" if b else barcode.strip()
    b = brand4(brand_name)
    v = vehicle3(vehicle_model)
    if b and v:
        return f"AFP-{b}-{v}-{make_hash(pid, 6)}"
    elif b:
        return f"AFP-{b}-{make_hash(pid, 8)}"
    else:
        return f"AFP-{make_hash(pid, 10)}"

def generate_skus(rows: list) -> list[tuple[str, str]]:
    """rows: [(product_id, barcode, brand_name, vehicle_model), ...] → [(pid, sku), ...]"""
    result: list[tuple[str, str]] = []
    seen: set[str] = set()
    for pid, barcode, brand_name, vehicle_model in rows:
        sku = build_sku(pid, brand_name or None, vehicle_model or None, barcode or None)
        if sku in seen:
            sku = sku + '-' + make_hash(pid, 4)
        seen.add(sku)
        result.append((pid, sku))
    return result

def print_summary(label: str, skus: list[tuple[str, str]]) -> None:
    tier_bc  = sum(1 for _, s in skus if not s.startswith('AFP-'))
    tier_afp = len(skus) - tier_bc
    print(f"\n  [{label}] Toplam: {len(skus):,}  |  Tier-1 barcode: {tier_bc:,}  |  Tier-2 AFP: {tier_afp:,}")
    print(f"  Örnekler (ilk 10):")
    for pid, sku in skus[:10]:
        print(f"    {pid[:8]}...  →  {sku}")


# ════════════════════════════════════════════════════════════════════════════════
print("=" * 65)
print(f"  SKU ÜRETIM  (DRY_RUN={DRY_RUN})")
print("=" * 65)

# ── 1. LOCAL DB ───────────────────────────────────────────────────────────────
print("\n[1/4] Local DB sorgulanıyor...")
local_conn = psycopg2.connect(LOCAL_DSN)
local_cur  = local_conn.cursor()
local_cur.execute('''
    SELECT p."Id"::text, p."Barcode", b."Name", p."VehicleModel"
    FROM "Products" p
    LEFT JOIN "Brands" b ON b."Id" = p."BrandId"
    WHERE p."SKU" IS NULL AND p."IsDeleted" = false
    ORDER BY p."CreatedDate"
''')
local_rows = local_cur.fetchall()
print(f"  Local SKU'suz ürün: {len(local_rows):,}")

local_skus = generate_skus(local_rows)
print_summary("LOCAL", local_skus)

if not DRY_RUN and local_skus:
    print("\n[2/4] Local DB güncelleniyor...")
    t0 = time.time()
    psycopg2.extras.execute_batch(
        local_cur,
        'UPDATE "Products" SET "SKU" = %s WHERE "Id" = %s::uuid AND "SKU" IS NULL',
        [(sku, pid) for pid, sku in local_skus],
        page_size=5000
    )
    local_conn.commit()
    print(f"  {len(local_skus):,} satır güncellendi ({time.time()-t0:.1f}s)")
else:
    print("\n[2/4] Local DB güncelleme: ATLAIDI (DRY_RUN veya boş)" if DRY_RUN else "[2/4] Local'de SKU'suz ürün yok.")

local_cur.close(); local_conn.close()

# ── 2. SERVER: SKU'suz ürünleri export et ────────────────────────────────────
print("\n[3/4] Server'a bağlanılıyor (SSH)...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=30)
print(f"  Bağlandı: {SSH_HOST}")

# Server'daki SKU'suz ürünleri container'dan CSV'ye export et
# \COPY (query) TO — psql meta-komutu tek satır gerektirir
export_sql = (
    "\\COPY (SELECT p.\"Id\"::text, COALESCE(p.\"Barcode\",''),"
    " COALESCE(b.\"Name\",''), COALESCE(p.\"VehicleModel\",'')"
    " FROM \"Products\" p"
    " LEFT JOIN \"Brands\" b ON b.\"Id\" = p.\"BrandId\""
    " WHERE p.\"SKU\" IS NULL AND p.\"IsDeleted\" = false"
    " ORDER BY p.\"CreatedDate\")"
    " TO '/tmp/sku_less_server.csv' WITH (FORMAT CSV, HEADER false);\n"
)
sftp = ssh.open_sftp()
sftp.putfo(io.BytesIO(export_sql.encode('utf-8')), '/tmp/sku_export.sql')
sftp.close()

print("  Server SKU'suz ürünler export ediliyor (birkaç dakika sürebilir)...")
t1 = time.time()
_, out, err = ssh.exec_command(
    f'docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} < /tmp/sku_export.sql',
    timeout=600
)
out_text = out.read().decode('utf-8', errors='replace').strip()
err_text = err.read().decode('utf-8', errors='replace').strip()
print(f"  Export tamamlandı ({time.time()-t1:.1f}s): {out_text}")
if err_text:
    print(f"  STDERR: {err_text[:300]}")

# Container'dan host'a kopyala
_, out2, err2 = ssh.exec_command(
    f'docker cp {CONTAINER}:/tmp/sku_less_server.csv /tmp/sku_less_server.csv',
    timeout=120
)
out2.read(); err2.read()

# SFTP ile local'e indir
print("  CSV indiriliyor...")
t2 = time.time()
server_csv_buf = io.BytesIO()
sftp = ssh.open_sftp()
sftp.getfo('/tmp/sku_less_server.csv', server_csv_buf)
sftp.close()
server_csv_buf.seek(0)
raw_bytes = server_csv_buf.getvalue()
mb = len(raw_bytes) / 1024**2
print(f"  {mb:.1f} MB indirildi ({time.time()-t2:.1f}s)")

# CSV parse et (csv modülü ile — embedded comma/newline güvenli)
server_csv_buf.seek(0)
reader = csv.reader(io.StringIO(raw_bytes.decode('utf-8', errors='replace')))
server_rows = []
for row in reader:
    if len(row) == 4:
        pid, barcode, brand_name, vehicle_model = row
        server_rows.append((pid, barcode or None, brand_name or None, vehicle_model or None))

print(f"  Server SKU'suz ürün: {len(server_rows):,}")

server_skus = generate_skus(server_rows)
print_summary("SERVER", server_skus)

if DRY_RUN:
    print(f"\nDRY_RUN=True → hiçbir şey yazılmadı.")
    print(f"\nÖzet:")
    print(f"  Local  SKU üretilecek: {len(local_skus):,}")
    print(f"  Server SKU üretilecek: {len(server_skus):,}")
    print(f"  TOPLAM               : {len(local_skus) + len(server_skus):,}")
    ssh.close()
    sys.exit(0)

# ── 3. SERVER DB GÜNCELLE ─────────────────────────────────────────────────────
print(f"\n[4/4] Server DB güncelleniyor ({len(server_skus):,} SKU)...")

# CSV hazırla ve yükle
print("  CSV yükleniyor...")
csv_upload = io.BytesIO()
csv_upload.write(b"Id,SKU\n")
for pid, sku in server_skus:
    csv_upload.write(f"{pid},{sku}\n".encode('utf-8'))
csv_size = csv_upload.tell()
csv_upload.seek(0)

sftp = ssh.open_sftp()
sftp.putfo(csv_upload, '/tmp/sku_update_server.csv')
sftp.close()
print(f"  {csv_size/1024**2:.1f} MB yüklendi")

_, out3, err3 = ssh.exec_command(
    f'docker cp /tmp/sku_update_server.csv {CONTAINER}:/tmp/sku_update_server.csv',
    timeout=120
)
out3.read(); err3.read()

# Uygulama SQL'i
apply_sql = (
    "BEGIN;\n"
    "CREATE TEMP TABLE _sku_map (\"Id\" uuid, \"SKU\" text) ON COMMIT DROP;\n"
    "\\COPY _sku_map FROM '/tmp/sku_update_server.csv' CSV HEADER;\n"
    "UPDATE \"Products\" p SET \"SKU\" = m.\"SKU\"\n"
    "FROM _sku_map m WHERE p.\"Id\" = m.\"Id\" AND p.\"SKU\" IS NULL;\n"
    "COMMIT;\n"
    "SELECT COUNT(*) AS sku_lu_urun FROM \"Products\" WHERE \"SKU\" IS NOT NULL AND \"IsDeleted\"=false;\n"
    "SELECT COUNT(*) AS sku_suz_kalan FROM \"Products\" WHERE \"SKU\" IS NULL AND \"IsDeleted\"=false;\n"
)
sftp = ssh.open_sftp()
sftp.putfo(io.BytesIO(apply_sql.encode('utf-8')), '/tmp/sku_apply.sql')
sftp.close()

t3 = time.time()
_, out4, err4 = ssh.exec_command(
    f'docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} < /tmp/sku_apply.sql',
    timeout=900
)
result_text = out4.read().decode('utf-8', errors='replace')
print(result_text)
e4 = err4.read().decode('utf-8', errors='replace').strip()
if e4:
    print(f"  STDERR: {e4[:400]}")
print(f"  Süre: {time.time()-t3:.1f}s")

ssh.close()
print("\nTamamlandı.")
print(f"\nFinal Özet:")
print(f"  Local güncellenen  : {len(local_skus):,}")
print(f"  Server güncellenen : {len(server_skus):,}")
