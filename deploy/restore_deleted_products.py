"""
Bugun (2026-07-25) yanlis olarak silinen urunleri geri getirir.
Kapsam: IsDeleted=true ve UpdatedDate = bugun olan tum urunler (1,541 adet).
"""
import sys, paramiko, socket, threading, psycopg2, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '31.210.40.242'; USER = 'bilgi'; PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_IP = '172.18.0.4'; LOCAL_PORT = 15447

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
conn.autocommit = False
cur = conn.cursor()

# Bugun silinen urunlerin ID lerini al
cur.execute("""
    SELECT "Id"::text FROM "Products"
    WHERE "IsDeleted" = true
      AND DATE("UpdatedDate") = CURRENT_DATE
""")
ids = [r[0] for r in cur.fetchall()]
print(f"Geri getirilecek urun sayisi: {len(ids):,}")

if not ids:
    print("Geri getirilecek urun yok.")
    conn.close(); srv.close(); client.close()
    sys.exit(0)

# Oncelikle iliskili varyant ve resimlerin durumunu kontrol et
cur.execute("""
    SELECT COUNT(*) FROM "ProductVariants"
    WHERE "ProductId"::text = ANY(%s) AND "IsDeleted" = true
""", (ids,))
deleted_variants = cur.fetchone()[0]

cur.execute("""
    SELECT COUNT(*) FROM "ProductImages"
    WHERE "ProductId"::text = ANY(%s) AND "IsDeleted" = true
""", (ids,))
deleted_images = cur.fetchone()[0]

print(f"Iliskili silinmis varyant: {deleted_variants:,}")
print(f"Iliskili silinmis resim: {deleted_images:,}")
print()

# Urunleri geri getir
cur.execute("""
    UPDATE "Products"
    SET "IsDeleted" = false, "IsActive" = true, "UpdatedDate" = NOW()
    WHERE "IsDeleted" = true
      AND DATE("UpdatedDate") = CURRENT_DATE
""")
restored_products = cur.rowcount
print(f"Geri getirilen urun: {restored_products:,}")

# Varyantlari geri getir (ilgili urunlere ait silinmis varyantlar)
if deleted_variants > 0:
    cur.execute("""
        UPDATE "ProductVariants"
        SET "IsDeleted" = false, "IsActive" = true
        WHERE "ProductId"::text = ANY(%s) AND "IsDeleted" = true
    """, (ids,))
    restored_variants = cur.rowcount
    print(f"Geri getirilen varyant: {restored_variants:,}")

# Resimleri geri getir
if deleted_images > 0:
    cur.execute("""
        UPDATE "ProductImages"
        SET "IsDeleted" = false
        WHERE "ProductId"::text = ANY(%s) AND "IsDeleted" = true
    """, (ids,))
    restored_images = cur.rowcount
    print(f"Geri getirilen resim: {restored_images:,}")

conn.commit()
print("\nRestore tamamlandi.")

# Son durum
cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
print(f"Toplam aktif urun: {cur.fetchone()[0]:,}")

cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=true')
print(f"Kalan silinmis urun: {cur.fetchone()[0]:,}")

conn.close(); srv.close(); client.close()
print("Done")
