# -*- coding: utf-8 -*-
"""
-v{n} formatindaki SKU'lari urun basligindaki parca numarasini kullanarak
anlasilir hale getirir.

Kural:
  Baslik: "FEBI BILSTEIN 39677 | Rot Takimi On Sol BMW F10 F11 F08"
  Eski SKU: BILSTEIN-v1701
  Yeni SKU: BILSTEIN-39677-v1701

  Parca kodu base SKU ile ayniysa araç bilgisi kullanilir:
  Baslik: "MANN W712-95 | Seat Leon 1.5 EcoTSI Yag Filtresi"
  Eski SKU: W712-95-v2
  Yeni SKU: W712-95-SEAT-LEON-v2
"""
import sys, re, time, socket, threading, paramiko, psycopg2
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '31.210.40.242'; USER = 'bilgi'; PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_IP = '172.18.0.4'; LOCAL_PORT = 15443

# ---- SSH Tunnel ---------------------------------------------------------------
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
transport = client.get_transport()

def forward(sock):
    try:
        ch = transport.open_channel('direct-tcpip', (PG_IP, 5432), ('127.0.0.1', LOCAL_PORT))
        def pump(s, d):
            try:
                while True:
                    b = s.recv(4096)
                    if not b: break
                    d.sendall(b)
            except: pass
            finally:
                try: s.close()
                except: pass
                try: d.close()
                except: pass
        threading.Thread(target=pump, args=(sock, ch), daemon=True).start()
        threading.Thread(target=pump, args=(ch, sock), daemon=True).start()
    except: sock.close()

srv = socket.socket(); srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(('127.0.0.1', LOCAL_PORT)); srv.listen(20); srv.settimeout(5)
threading.Thread(target=lambda: [forward(s) for s, _ in iter(lambda: srv.accept(), None)], daemon=True).start()
time.sleep(0.5)

def connect():
    _, out, _ = client.exec_command("grep '^POSTGRES_PASSWORD=' /opt/ecom/.env | cut -d= -f2-", timeout=10)
    pg_pass = out.read().decode().strip()
    return psycopg2.connect(host='127.0.0.1', port=LOCAL_PORT, dbname='EcomDb',
                            user='ecom', password=pg_pass, connect_timeout=15)

# ---- SKU parsing ---------------------------------------------------------------
V_RE = re.compile(r'^(.+)-v(\d+)$', re.IGNORECASE)

def parse_v_sku(sku):
    """Returns (base, version_str) or (None, None)."""
    m = V_RE.match(sku)
    return (m.group(1), m.group(2)) if m else (None, None)

SKIP_WORDS = {
    've', 'ile', 'icin', 'on', 'arka', 'sol', 'sag', 'adet', 'takim',
    'kiti', 'seti', 'marka', 'orijinal', 'urun', 'komple',
    'model', 'sonrasi', 'oncesi', 'arasi', 'serisi', 'benzinli',
    'dizel', 'turbo', 'otomatik', 'manuel', 'cift', 'tek',
}

def extract_part_code(base_sku, name):
    """
    Baslik formatindan parca kodunu ya da arac bilgisini cikarir.
    Format: "MARKA PARCA_NO | Aciklama" veya sadece "Aciklama"
    """
    if not name:
        return None
    name = name.strip()

    if '|' in name:
        before = name.split('|')[0].strip()
        after  = name.split('|', 1)[1].strip()
        tokens = before.split()

        # Son token genellikle parca numarasi
        if tokens:
            last = tokens[-1].strip('()[].,')
            # Parca numarasi base SKU'dan farkli ve anlamli ise kullan
            if last and last.upper() != base_sku.upper() and len(last) >= 2:
                # Parca numarasi cok kisa ve sadece rakamdan ibaretse kontrol et
                if not (len(last) <= 2 and last.isdigit()):
                    return last

        # Parca kodu base SKU ile ayni → aciklamadan arac bilgisi al
        tokens_after = [t.strip('()[].,/-') for t in after.split()]
        meaningful = []
        for t in tokens_after:
            if (len(t) >= 3
                    and not t.replace('.', '').replace('-', '').isdigit()
                    and t.lower() not in SKIP_WORDS):
                meaningful.append(t.upper())
            if len(meaningful) >= 2:
                break
        if meaningful:
            return '-'.join(meaningful)

    # | yoksa ilk anlamli kelimeler
    tokens = name.split()
    meaningful = []
    for t in tokens[:8]:
        t2 = t.strip('()[].,|/-')
        if (len(t2) >= 3
                and not t2.replace('.', '').replace('-', '').isdigit()
                and t2.lower() not in SKIP_WORDS):
            meaningful.append(t2.upper())
        if len(meaningful) >= 2:
            break
    return '-'.join(meaningful) if meaningful else None

def build_new_sku(base, part_code, version, used_skus):
    """Yeni SKU olusturur, benzersizligini garantiler."""
    candidate = f'{base}-{part_code}-v{version}' if part_code else f'{base}-v{version}'
    candidate = candidate[:100]  # max uzunluk

    if candidate not in used_skus:
        return candidate

    # Cakisma varsa sonuna sayac ekle
    i = 2
    while True:
        c2 = f'{candidate}-{i}'[:100]
        if c2 not in used_skus:
            return c2
        i += 1

# ---- Ana islem ----------------------------------------------------------------
print('Baglaniliyor...')
conn = connect()
conn.autocommit = False
cur = conn.cursor()

# Toplam -v{n} urun sayisi
cur.execute(r"""
    SELECT COUNT(*) FROM "Products"
    WHERE "SKU" ~ '-v[0-9]+$' AND "IsDeleted"=false
""")
total = cur.fetchone()[0]
print(f'Guncellenecek -v{{n}} urun sayisi: {total:,}')

# Mevcut tum SKU'lari yukle (benzersizlik icin)
print('Mevcut SKU seti yukleniyor...')
cur.execute('SELECT "SKU" FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NOT NULL')
existing_skus = set(r[0] for r in cur.fetchall())
print(f'Mevcut SKU sayisi: {len(existing_skus):,}')

# -v{n} urunleri cek
cur.execute(r"""
    SELECT p."Id", p."SKU", p."Name"
    FROM "Products" p
    WHERE p."SKU" ~ '-v[0-9]+$' AND p."IsDeleted"=false
    ORDER BY p."SKU"
""")
products = cur.fetchall()
print(f'Yuklendi. Islem basladi...\n')

updated = skipped = errors = 0
used_new_skus = set()  # bu calisma icinde atananlar

# -v{n} urunlerin eski SKU'larini once cikar (yeni hesapta cakisma olmamasi icin)
old_v_skus = set(r[1] for r in products)
available_skus = existing_skus - old_v_skus  # mevcut "diger" SKU'lar

start = time.time()
batch_updates = []

for pid, sku, name in products:
    try:
        base, version = parse_v_sku(sku)
        if not base or not version:
            skipped += 1
            continue

        part_code = extract_part_code(base, name)
        new_sku   = build_new_sku(base, part_code, version, available_skus | used_new_skus)

        if new_sku == sku:
            skipped += 1
            continue

        batch_updates.append((new_sku, pid, sku))
        used_new_skus.add(new_sku)
        updated += 1

        if len(batch_updates) >= 500:
            for new_s, pid_, old_s in batch_updates:
                cur.execute('UPDATE "Products" SET "SKU"=%s WHERE "Id"=%s', (new_s, pid_))
                cur.execute('UPDATE "ProductVariants" SET "SKU"=%s WHERE "ProductId"=%s', (new_s, pid_))
            conn.commit()
            batch_updates.clear()
            elapsed = time.time() - start
            rate = updated / elapsed if elapsed > 0 else 1
            remaining = (total - updated - skipped - errors) / rate if rate > 0 else 0
            print(f'[{time.strftime("%H:%M:%S")}] {updated+skipped+errors:>7,}/{total:,} | '
                  f'+{updated:,} ={skipped} !{errors} | {rate:.0f}/sn | ~{remaining/60:.1f}dk', flush=True)

    except Exception as e:
        errors += 1
        print(f'HATA SKU={sku}: {e}')
        conn.rollback()

# Son batch
if batch_updates:
    for new_s, pid_, old_s in batch_updates:
        cur.execute('UPDATE "Products" SET "SKU"=%s WHERE "Id"=%s', (new_s, pid_))
        cur.execute('UPDATE "ProductVariants" SET "SKU"=%s WHERE "ProductId"=%s', (new_s, pid_))
    conn.commit()

elapsed = time.time() - start
print(f'\n{"="*60}')
print(f'Tamamlandi: +{updated:,} guncellendi | ={skipped} atlanil | !{errors} hata | {elapsed/60:.1f} dk')

# Ornek kontrol
cur.execute(r"""
    SELECT "SKU", "Name"
    FROM "Products"
    WHERE "SKU" ~ '-v[0-9]+$' AND "IsDeleted"=false
    ORDER BY "CreatedDate" DESC
    LIMIT 10
""")
rows = cur.fetchall()
print(f'\nOrnek guncellenmis SKU ler:')
for r in rows:
    print(f'  {r[0]} | {(r[1] or "")[:60]}')

cur.close(); conn.close(); srv.close(); client.close()
print('Done')
