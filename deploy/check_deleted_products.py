import sys, paramiko, socket, threading, psycopg2, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '31.210.40.242'; USER = 'bilgi'; PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_IP = '172.18.0.4'; LOCAL_PORT = 15446

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

print("=== Silinmis urun analizi ===\n")

# Tum silinmis urunler - DataSource ve tarih bazli
cur.execute("""
    SELECT
        COALESCE("DataSource", 'NULL') as ds,
        DATE("UpdatedDate") as gun,
        COUNT(*) as sayi
    FROM "Products"
    WHERE "IsDeleted" = true
    GROUP BY COALESCE("DataSource", 'NULL'), DATE("UpdatedDate")
    ORDER BY gun DESC, sayi DESC
""")
rows = cur.fetchall()
print("DataSource | Tarih       | Sayi")
print("-" * 45)
for r in rows:
    print(f"  {str(r[0]):<12} | {str(r[1]):<11} | {r[2]:,}")

# Toplam silinmis
cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=true')
print(f"\nToplam silinmis urun: {cur.fetchone()[0]:,}")

# Aktif urun sayisi
cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
print(f"Toplam aktif urun: {cur.fetchone()[0]:,}")

# Bugun silinmisler - detay
cur.execute("""
    SELECT COUNT(*) FROM "Products"
    WHERE "IsDeleted"=true
      AND DATE("UpdatedDate") = CURRENT_DATE
""")
print(f"\nBugun silinen urun: {cur.fetchone()[0]:,}")

# DataSource=catalogiq silinmisler
cur.execute("""
    SELECT COUNT(*) FROM "Products"
    WHERE "IsDeleted"=true AND "DataSource"='catalogiq'
""")
cat_deleted = cur.fetchone()[0]
print(f"DataSource=catalogiq silinmis: {cat_deleted:,}")

# DataSource=NULL silinmisler - bugun
cur.execute("""
    SELECT COUNT(*) FROM "Products"
    WHERE "IsDeleted"=true
      AND "DataSource" IS NULL
      AND DATE("UpdatedDate") = CURRENT_DATE
""")
print(f"DataSource=NULL bugun silinen: {cur.fetchone()[0]:,}")

conn.close(); srv.close(); client.close()
print("\nDone")
