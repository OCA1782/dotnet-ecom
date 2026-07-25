"""
1. Bulutx postgres sifresini .env ile esitler
2. Son silinen tum urunleri geri getirir (bugun silinmis, IsDeleted=true)
"""
import sys, paramiko, socket, threading, psycopg2, time, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '31.210.40.242'; USER = 'bilgi'; PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_IP = '172.18.0.4'; LOCAL_PORT = 15448

# SSH baglantisi
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=10)

def run(cmd, timeout=30):
    _, out, err = client.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

# Bulutx .env den postgres sifresini al
pg_pass = run("grep '^POSTGRES_PASSWORD=' /opt/ecom/.env | cut -d= -f2-")
pg_user = run("grep '^POSTGRES_USER=' /opt/ecom/.env | cut -d= -f2-") or 'ecom'
print(f"Bulutx .env POSTGRES_USER={pg_user}")
print(f"Bulutx .env POSTGRES_PASSWORD={pg_pass[:4]}***")

# Postgres konteynerde sifreyi guncelle (ALTER USER)
alter_cmd = f'docker exec ecom-postgres-1 psql -U {pg_user} -d EcomDb -c "ALTER USER {pg_user} WITH PASSWORD \'{pg_pass}\';"'
result = run(alter_cmd, timeout=15)
print(f"ALTER USER: {result}")

# API containerini yeniden baslat
print("\nAPI container yeniden baslatiliyor...")
print(run("docker restart ecom-api-1", timeout=30))

time.sleep(8)
print(run("docker inspect ecom-api-1 --format '{{.State.Status}}'"))

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

conn = psycopg2.connect(host='127.0.0.1', port=LOCAL_PORT, dbname='EcomDb',
                        user=pg_user, password=pg_pass, connect_timeout=15)
conn.autocommit = False
cur = conn.cursor()

# Bugun silinen tum urunleri geri getir (onceki restore + yeni 20)
cur.execute("""
    SELECT COUNT(*) FROM "Products"
    WHERE "IsDeleted" = true AND DATE("UpdatedDate") = CURRENT_DATE
""")
to_restore = cur.fetchone()[0]
print(f"\nBugun silinmis ve geri getirilecek urun: {to_restore}")

if to_restore > 0:
    # Urun ID leri al
    cur.execute("""
        SELECT "Id"::text FROM "Products"
        WHERE "IsDeleted" = true AND DATE("UpdatedDate") = CURRENT_DATE
    """)
    ids = [r[0] for r in cur.fetchall()]

    cur.execute("""
        UPDATE "Products"
        SET "IsDeleted" = false, "IsActive" = true, "UpdatedDate" = NOW()
        WHERE "IsDeleted" = true AND DATE("UpdatedDate") = CURRENT_DATE
    """)
    print(f"Geri getirilen urun: {cur.rowcount}")

    # Varyantlar
    cur.execute("""
        UPDATE "ProductVariants" SET "IsDeleted" = false, "IsActive" = true
        WHERE "ProductId"::text = ANY(%s) AND "IsDeleted" = true
    """, (ids,))
    if cur.rowcount > 0:
        print(f"Geri getirilen varyant: {cur.rowcount}")

    conn.commit()

cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
print(f"\nToplam aktif urun: {cur.fetchone()[0]:,}")

conn.close(); srv.close()

# API durumunu bekle
time.sleep(10)
status = run("docker inspect ecom-api-1 --format '{{.State.Status}} {{.State.Health.Status}}'")
print(f"\nAPI son durum: {status}")

client.close()
print("Done")
