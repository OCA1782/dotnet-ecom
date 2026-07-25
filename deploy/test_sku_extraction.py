# -*- coding: utf-8 -*-
"""
SKU cikarma mantigini veritabanina yazmadan test eder.
"""
import sys, re, time, socket, threading, paramiko, psycopg2
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '31.210.40.242'; USER = 'bilgi'; PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_IP = '172.18.0.4'; LOCAL_PORT = 15444

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

_, out, _ = client.exec_command("grep '^POSTGRES_PASSWORD=' /opt/ecom/.env | cut -d= -f2-", timeout=10)
pg_pass = out.read().decode().strip()
conn = psycopg2.connect(host='127.0.0.1', port=LOCAL_PORT, dbname='EcomDb',
                        user='ecom', password=pg_pass, connect_timeout=15)
cur = conn.cursor()

V_RE = re.compile(r'^(.+)-v(\d+)$', re.IGNORECASE)
SKIP_WORDS = {'ve','ile','icin','on','arka','sol','sag','adet','takim','kiti','seti','marka','orijinal','urun','komple'}

def extract_part_code(base_sku, name):
    if not name: return None
    name = name.strip()
    if '|' in name:
        before = name.split('|')[0].strip()
        after  = name.split('|', 1)[1].strip()
        tokens = before.split()
        if tokens:
            last = tokens[-1].strip('()[].,')
            if last and last.upper() != base_sku.upper() and len(last) >= 2:
                if not (len(last) <= 2 and last.isdigit()):
                    return last
        tokens_after = [t.strip('()[].,/-') for t in after.split()]
        meaningful = []
        for t in tokens_after:
            if (len(t) >= 3 and not t.replace('.','').replace('-','').isdigit()
                    and t.lower() not in SKIP_WORDS):
                meaningful.append(t.upper())
            if len(meaningful) >= 2: break
        if meaningful: return '-'.join(meaningful)
    tokens = name.split()
    meaningful = []
    for t in tokens[:8]:
        t2 = t.strip('()[].,|/-')
        if (len(t2) >= 3 and not t2.replace('.','').replace('-','').isdigit()
                and t2.lower() not in SKIP_WORDS):
            meaningful.append(t2.upper())
        if len(meaningful) >= 2: break
    return '-'.join(meaningful) if meaningful else None

# Farkli base SKU gruplarından ornekler al
cur.execute(r"""
    SELECT "SKU", "Name"
    FROM "Products"
    WHERE "SKU" ~ '-v[0-9]+$' AND "IsDeleted"=false
    ORDER BY LENGTH("SKU") - LENGTH(REPLACE("SKU", '-', '')), RANDOM()
    LIMIT 40
""")
rows = cur.fetchall()

print(f'{"ESKİ SKU":<35} {"YENİ SKU":<45} BASLIK')
print('-' * 130)
for sku, name in rows:
    m = V_RE.match(sku)
    if not m: continue
    base, ver = m.group(1), m.group(2)
    part = extract_part_code(base, name)
    new_sku = f'{base}-{part}-v{ver}' if part else f'{base}-v{ver}'
    new_sku = new_sku[:80]
    title_short = (name or '')[:60]
    print(f'{sku:<35} {new_sku:<45} {title_short}')

cur.close(); conn.close(); srv.close(); client.close()
print('\nTest tamamlandi.')
