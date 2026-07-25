import paramiko, socket, threading, psycopg2, time

HOST = '31.210.40.242'
USER = 'bilgi'
PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_IP = '172.18.0.4'
LOCAL_PORT = 15441

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=10)
transport = client.get_transport()

def forward(local_sock):
    try:
        remote = transport.open_channel('direct-tcpip', (PG_IP, 5432), ('127.0.0.1', LOCAL_PORT))
        def fwd(src, dst):
            try:
                while True:
                    d = src.recv(4096)
                    if not d:
                        break
                    dst.send(d)
            except:
                pass
            finally:
                try: src.close()
                except: pass
                try: dst.close()
                except: pass
        threading.Thread(target=fwd, args=(local_sock, remote), daemon=True).start()
        threading.Thread(target=fwd, args=(remote, local_sock), daemon=True).start()
    except:
        local_sock.close()

srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(('127.0.0.1', LOCAL_PORT))
srv.listen(5)
srv.settimeout(5)

def accept():
    while True:
        try:
            s, _ = srv.accept()
            threading.Thread(target=forward, args=(s,), daemon=True).start()
        except:
            break

threading.Thread(target=accept, daemon=True).start()
time.sleep(0.5)

print("Fetching CatalogIQ unique SKUs...")
cat_conn = psycopg2.connect(
    host='127.0.0.1', port=5436, dbname='catalogiq',
    user='catalogiq', password='catalogiq', connect_timeout=10
)
cat_cur = cat_conn.cursor()
cat_cur.execute("""
    SELECT DISTINCT "Sku"
    FROM "NormalizedProducts"
    WHERE "SourceSiteId"='bc87db68-ebd1-4a35-8656-75ba5b422d72'
      AND "IsDeleted"=false
      AND "Title" IS NOT NULL
      AND "Sku" IS NOT NULL
      AND "PriceCurrent">0
""")
ciq_skus = set(r[0] for r in cat_cur.fetchall())
cat_conn.close()
print(f"CatalogIQ unique SKUs: {len(ciq_skus):,}")

print("Fetching Bulutx SKUs...")
bulutx_conn = psycopg2.connect(
    host='127.0.0.1', port=LOCAL_PORT, dbname='EcomDb',
    user='ecom', password='ecom_prod_2026', connect_timeout=10
)
bulutx_cur = bulutx_conn.cursor()
bulutx_cur.execute('SELECT DISTINCT "SKU" FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NOT NULL')
ecom_skus = set(r[0] for r in bulutx_cur.fetchall())
bulutx_conn.close()
print(f"Bulutx unique SKUs: {len(ecom_skus):,}")

missing = ciq_skus - ecom_skus
print(f"\nMissing SKUs (in CatalogIQ but not in Bulutx): {len(missing):,}")

if missing:
    sample = list(missing)[:10]
    print(f"Sample missing SKUs: {sample}")

srv.close()
client.close()
print("Done")
