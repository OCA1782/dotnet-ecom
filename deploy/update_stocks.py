# -*- coding: utf-8 -*-
"""
Tum urunlerin stok miktarini 100 olarak gunceller.
- Mevcut stok kaydi varsa: Quantity = 100
- Stok kaydi yoksa: yeni kayit olusturur (Quantity=100, WarehouseCode=DEFAULT)

DRY_RUN = True  -> sadece sayilari gosterir
DRY_RUN = False -> local + server DB'ye yazar
"""
import os, sys, io, time, paramiko, psycopg2, psycopg2.extras
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

print("=" * 60)
print(f"STOK GUNCELLEME  (DRY_RUN={DRY_RUN})")
print("=" * 60)

# SQL
UPDATE_SQL = '''
UPDATE "Stocks"
SET "Quantity" = 100, "UpdatedDate" = NOW()
WHERE "IsDeleted" = false AND "Quantity" != 100;
'''

INSERT_SQL = '''
INSERT INTO "Stocks" ("Id", "ProductId", "WarehouseCode", "Quantity", "ReservedQuantity", "CriticalStockLevel", "CreatedDate", "IsDeleted")
SELECT
    gen_random_uuid(),
    p."Id",
    'DEFAULT',
    100,
    0,
    5,
    NOW(),
    false
FROM "Products" p
WHERE p."IsDeleted" = false
  AND NOT EXISTS (
      SELECT 1 FROM "Stocks" s WHERE s."ProductId" = p."Id" AND s."IsDeleted" = false
  );
'''

SUMMARY_SQL = '''
SELECT
    (SELECT COUNT(*) FROM "Stocks" WHERE "IsDeleted" = false) AS toplam_stok,
    (SELECT COUNT(*) FROM "Stocks" WHERE "IsDeleted" = false AND "Quantity" = 100) AS qty_100,
    (SELECT COUNT(*) FROM "Products" WHERE "IsDeleted" = false) AS toplam_urun,
    (SELECT COUNT(*) FROM "Products" p WHERE "IsDeleted" = false
       AND NOT EXISTS (SELECT 1 FROM "Stocks" s WHERE s."ProductId" = p."Id" AND s."IsDeleted" = false)
    ) AS stoksuz_urun;
'''

# ── 1. LOCAL DB ────────────────────────────────────────────────────────────────
print("\n[LOCAL] Durum kontrol ediliyor...")
conn = psycopg2.connect(LOCAL_DSN)
cur  = conn.cursor()

cur.execute(SUMMARY_SQL)
row = cur.fetchone()
print(f"  Toplam stok kaydi  : {row[0]:,}")
print(f"  Qty=100 olan       : {row[1]:,}")
print(f"  Toplam urun        : {row[2]:,}")
print(f"  Stok kaydi olmayan : {row[3]:,}")

if DRY_RUN:
    print("\nDRY_RUN=True -> hicbir sey yazilmadi.")
    cur.close(); conn.close()
else:
    print("\n[LOCAL] Mevcut stoklar guncelleniyor (Quantity=100)...")
    t0 = time.time()
    cur.execute(UPDATE_SQL)
    updated = cur.rowcount
    conn.commit()
    print(f"  {updated:,} satir guncellendi ({time.time()-t0:.1f}s)")

    print("[LOCAL] Eksik stok kayitlari olusturuluyor...")
    t1 = time.time()
    cur.execute(INSERT_SQL)
    inserted = cur.rowcount
    conn.commit()
    print(f"  {inserted:,} yeni kayit olusturuldu ({time.time()-t1:.1f}s)")

    cur.execute(SUMMARY_SQL)
    row = cur.fetchone()
    print(f"\n[LOCAL] Final durum:")
    print(f"  Toplam stok: {row[0]:,}  |  Qty=100: {row[1]:,}  |  Stoksuz: {row[3]:,}")

cur.close(); conn.close()

if DRY_RUN:
    sys.exit(0)

# ── 2. SERVER DB (SSH) ─────────────────────────────────────────────────────────
print("\n[SERVER] SSH baglantisi...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=30)
print(f"  Baglandi: {SSH_HOST}")

def ssh_psql(sql_content: str, label: str, timeout: int = 600) -> str:
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql_content.encode('utf-8')), '/tmp/stock_op.sql')
    sftp.close()
    _, out, err = ssh.exec_command(
        f'docker exec -i {CONTAINER} psql -U {DB_USER} -d {DB_NAME} < /tmp/stock_op.sql',
        timeout=timeout
    )
    result = out.read().decode('utf-8', errors='replace')
    e = err.read().decode('utf-8', errors='replace').strip()
    if e and 'NOTICE' not in e and 'WARNING' not in e:
        print(f"  STDERR ({label}): {e[:200]}")
    return result

# Durum kontrol
summary_out = ssh_psql(SUMMARY_SQL, "summary")
print(f"[SERVER] Mevcut durum:\n{summary_out.strip()}")

# Guncelle
print("\n[SERVER] Mevcut stoklar guncelleniyor...")
t2 = time.time()
upd = ssh_psql(UPDATE_SQL, "update")
print(f"  {upd.strip()}  ({time.time()-t2:.1f}s)")

print("[SERVER] Eksik stok kayitlari olusturuluyor (bu uzun surebilir)...")
t3 = time.time()
ins = ssh_psql(INSERT_SQL, "insert", timeout=900)
print(f"  {ins.strip()}  ({time.time()-t3:.1f}s)")

# Final kontrol
final = ssh_psql(SUMMARY_SQL, "final")
print(f"\n[SERVER] Final durum:\n{final.strip()}")

ssh.close()
print("\nTamamlandi.")
