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

conn = psycopg2.connect(host='127.0.0.1', port=LOCAL_PORT, dbname='EcomDb', user='ecom', password='ecom_prod_2026', connect_timeout=10)
cur = conn.cursor()

cur.execute('SELECT "DataSource", COUNT(*) FROM "Products" WHERE "IsDeleted"=false GROUP BY "DataSource" ORDER BY COUNT(*) DESC')
print("== Products by DataSource ==")
for row in cur.fetchall():
    print(f"  {row[0] or 'NULL'}: {row[1]:,}")

cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false AND "DataSource"=\'catalogiq\'')
print(f"\nCatalogIQ migrated products: {cur.fetchone()[0]:,}")

cur.execute('SELECT COUNT(DISTINCT "SKU") FROM "Products" WHERE "IsDeleted"=false AND "DataSource"=\'catalogiq\'')
print(f"CatalogIQ unique SKUs in Ecom: {cur.fetchone()[0]:,}")

# Check creation date distribution for catalogiq products
cur.execute("""
    SELECT DATE("CreatedDate"), COUNT(*)
    FROM "Products"
    WHERE "DataSource"='catalogiq' AND "IsDeleted"=false
    GROUP BY DATE("CreatedDate")
    ORDER BY DATE("CreatedDate")
""")
print("\n== CatalogIQ products by creation date ==")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]:,}")

conn.close()
srv.close()
client.close()
print("Done")
