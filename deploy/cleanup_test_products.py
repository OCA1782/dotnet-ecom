"""
Test calismasindan kalan 273 ara urunu siler (DataSource=catalogiq, son 3 saatte olusanlari).
Tam migrasyonu temiz baslatmak icin calistirilir.
"""
import sys, paramiko, socket, threading, psycopg2, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '31.210.40.242'; USER = 'bilgi'; PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_IP = '172.18.0.4'; LOCAL_PORT = 15442

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
                    if not d: break
                    dst.send(d)
            except: pass
            finally:
                try: src.close()
                except: pass
                try: dst.close()
                except: pass
        threading.Thread(target=fwd, args=(local_sock, remote), daemon=True).start()
        threading.Thread(target=fwd, args=(remote, local_sock), daemon=True).start()
    except: local_sock.close()

srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(('127.0.0.1', LOCAL_PORT)); srv.listen(5); srv.settimeout(5)

def accept():
    while True:
        try:
            s, _ = srv.accept()
            threading.Thread(target=forward, args=(s,), daemon=True).start()
        except: break

threading.Thread(target=accept, daemon=True).start()
time.sleep(0.5)

conn = psycopg2.connect(host='127.0.0.1', port=LOCAL_PORT, dbname='EcomDb', user='ecom', password='ecom_prod_2026', connect_timeout=10)
conn.autocommit = False
cur = conn.cursor()

# Main run ended around 08:00 UTC, test run was at 09:58 UTC
# Delete catalogiq products created after 09:45 UTC (12:45 Turkish)
CUTOFF = '2026-07-25 09:45:00+00'

cur.execute("""
    SELECT COUNT(*) FROM "Products"
    WHERE "DataSource"='catalogiq' AND "CreatedDate" > %s AND "IsDeleted"=false
""", (CUTOFF,))
count = cur.fetchone()[0]
print(f"Silinecek test urunu sayisi: {count}")

if count == 0:
    print("Silinecek urun yok.")
    conn.close(); srv.close(); client.close()
    sys.exit(0)

# Get product IDs to delete
cur.execute("""
    SELECT "Id" FROM "Products"
    WHERE "DataSource"='catalogiq' AND "CreatedDate" > %s AND "IsDeleted"=false
""", (CUTOFF,))
ids = [r[0] for r in cur.fetchall()]  # keep as uuid

import psycopg2.extras
ids_str = [str(i) for i in ids]

cur.execute('DELETE FROM "ProductImages" WHERE "ProductId"::text = ANY(%s)', (ids_str,))
print(f"Silinen resim: {cur.rowcount}")

cur.execute('DELETE FROM "ProductVariants" WHERE "ProductId"::text = ANY(%s)', (ids_str,))
print(f"Silinen varyant: {cur.rowcount}")

cur.execute('DELETE FROM "Products" WHERE "Id"::text = ANY(%s)', (ids_str,))
print(f"Silinen urun: {cur.rowcount}")

conn.commit()
print("Temizlik tamamlandi.")

cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
print(f"Kalan toplam urun: {cur.fetchone()[0]:,}")

conn.close(); srv.close(); client.close()
print("Done")
