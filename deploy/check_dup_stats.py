import sys, paramiko, socket, threading, psycopg2, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '31.210.40.242'; USER = 'bilgi'; PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_IP = '172.18.0.4'; LOCAL_PORT = 15445

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=10)
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

print("=== Mevcut kriter: (Name + Price) ===")
cur.execute("""
    SELECT COUNT(*) FROM (
        SELECT "Name", "Price", COUNT(*) as cnt
        FROM "Products" WHERE NOT "IsDeleted"
        GROUP BY "Name", "Price"
        HAVING COUNT(*) > 1
    ) t
""")
print(f"  (Name+Price) duplicate grup sayisi: {cur.fetchone()[0]:,}")

cur.execute("""
    SELECT COALESCE(SUM(cnt-1),0) FROM (
        SELECT COUNT(*) as cnt
        FROM "Products" WHERE NOT "IsDeleted"
        GROUP BY "Name", "Price"
        HAVING COUNT(*) > 1
    ) t
""")
print(f"  Silinecek urun sayisi: {cur.fetchone()[0]:,}")

print("\n=== Yeni kriter: (Name + DataSource) ===")
cur.execute("""
    SELECT COUNT(*) FROM (
        SELECT "Name", COALESCE("DataSource",'') as ds, COUNT(*) as cnt
        FROM "Products" WHERE NOT "IsDeleted"
        GROUP BY "Name", COALESCE("DataSource",'')
        HAVING COUNT(*) > 1
    ) t
""")
print(f"  (Name+DataSource) duplicate grup sayisi: {cur.fetchone()[0]:,}")

cur.execute("""
    SELECT COALESCE(SUM(cnt-1),0) FROM (
        SELECT COUNT(*) as cnt
        FROM "Products" WHERE NOT "IsDeleted"
        GROUP BY "Name", COALESCE("DataSource",'')
        HAVING COUNT(*) > 1
    ) t
""")
print(f"  Silinecek urun sayisi: {cur.fetchone()[0]:,}")

print("\n=== Farkli DataSource'tan ayni isimli urunler (cross-source) ===")
cur.execute("""
    SELECT COUNT(DISTINCT "Name") FROM (
        SELECT "Name"
        FROM "Products" WHERE NOT "IsDeleted"
        GROUP BY "Name"
        HAVING COUNT(DISTINCT COALESCE("DataSource",'')) > 1
    ) t
""")
print(f"  Farkli DataSource'tan ayni isimli urun grubu: {cur.fetchone()[0]:,}")

conn.close(); srv.close(); client.close()
print("\nDone")
