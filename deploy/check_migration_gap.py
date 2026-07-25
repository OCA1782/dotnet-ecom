import paramiko, socket, threading, psycopg2, time

# CatalogIQ local DB
CAT_HOST = 'localhost'
CAT_PORT = 5436
CAT_DB = 'CatalogIQDb'
CAT_USER = 'catalogiq'
CAT_PASS = 'catalogiq_dev_2026'
SITE_ID = 'bc87db68-ebd1-4a35-8656-75ba5b422d72'

# Bulutx via SSH tunnel
BULUTX_HOST = '31.210.40.242'
BULUTX_USER = 'bilgi'
BULUTX_PASS = 'nAqAcUFeb9vUbruMon0b!'
PG_CONTAINER_IP = '172.18.0.4'
LOCAL_TUNNEL = 15441

def setup_tunnel():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(BULUTX_HOST, username=BULUTX_USER, password=BULUTX_PASS, timeout=10)
    transport = client.get_transport()

    def forward(local_sock):
        try:
            remote = transport.open_channel('direct-tcpip', (PG_CONTAINER_IP, 5432), ('127.0.0.1', LOCAL_TUNNEL))
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
    srv.bind(('127.0.0.1', LOCAL_TUNNEL))
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
    return client, srv

print("=== CatalogIQ Analysis ===")
cat_conn = psycopg2.connect(host=CAT_HOST, port=CAT_PORT, dbname=CAT_DB, user=CAT_USER, password=CAT_PASS, connect_timeout=10)
cat_cur = cat_conn.cursor()

cat_cur.execute('SELECT COUNT(*) FROM "Products" WHERE "SiteId" = %s', (SITE_ID,))
total_cat = cat_cur.fetchone()[0]
print(f"CatalogIQ total products for site: {total_cat}")

cat_cur.execute('SELECT COUNT(*) FROM "Products" WHERE "SiteId" = %s AND "Sku" IS NOT NULL AND "Sku" != \'\'', (SITE_ID,))
with_sku = cat_cur.fetchone()[0]
print(f"CatalogIQ products with valid SKU: {with_sku}")

cat_cur.execute('SELECT COUNT(*) FROM "Products" WHERE "SiteId" = %s AND "CategoryId" IS NOT NULL', (SITE_ID,))
with_cat = cat_cur.fetchone()[0]
print(f"CatalogIQ products with category: {with_cat}")

# Check how many have NULL category
cat_cur.execute('SELECT COUNT(*) FROM "Products" WHERE "SiteId" = %s AND "CategoryId" IS NULL', (SITE_ID,))
no_cat = cat_cur.fetchone()[0]
print(f"CatalogIQ products WITHOUT category: {no_cat}")

cat_conn.close()

print("\n=== Bulutx Analysis ===")
client, srv = setup_tunnel()
bulutx_conn = psycopg2.connect(host='127.0.0.1', port=LOCAL_TUNNEL, dbname='EcomDb', user='ecom', password='ecom_prod_2026', connect_timeout=10)
bulutx_cur = bulutx_conn.cursor()

bulutx_cur.execute('SELECT COUNT(*) FROM "Products"')
print(f"Bulutx total products: {bulutx_cur.fetchone()[0]}")

bulutx_cur.execute('SELECT COUNT(DISTINCT "SKU") FROM "Products"')
print(f"Bulutx unique SKUs: {bulutx_cur.fetchone()[0]}")

# Check products without variants
bulutx_cur.execute("""
    SELECT COUNT(*) FROM "Products" p
    LEFT JOIN "ProductVariants" pv ON pv."ProductId" = p."Id"
    WHERE pv."Id" IS NULL
""")
print(f"Bulutx products without variants: {bulutx_cur.fetchone()[0]}")

# Products by brand count
bulutx_cur.execute('SELECT COUNT(DISTINCT "BrandId") FROM "Products"')
print(f"Bulutx products use X distinct brands: {bulutx_cur.fetchone()[0]}")

bulutx_conn.close()
srv.close()
client.close()
print("Done")
