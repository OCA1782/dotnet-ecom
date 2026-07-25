# -*- coding: utf-8 -*-
"""
CatalogIQ -> Bulutx Ecom direkt DB migrasyon scripti.
HTTP API yerine SSH tunel uzerinden dogrudan PostgreSQL'e yazar.

Kullanim:
  python deploy/migrate_catalogiq_direct.py
  python deploy/migrate_catalogiq_direct.py --batch 1000 --offset 0
"""
import sys, argparse, re, time, logging, uuid, socket, threading

import psycopg2
import paramiko

# -- Konfigurasyon --------------------------------------------------------------
CATALOGIQ_DSN   = "host=127.0.0.1 port=5436 dbname=catalogiq user=catalogiq password=catalogiq"
SITE_ID         = "bc87db68-ebd1-4a35-8656-75ba5b422d72"

BULUTX_HOST     = "31.210.40.242"
BULUTX_USER     = "bilgi"
BULUTX_PASS     = "nAqAcUFeb9vUbruMon0b!"

PG_CONTAINER_IP = "172.18.0.4"
PG_PORT         = 5432
PG_DB           = "EcomDb"
PG_USER         = "ecom"
LOCAL_TUNNEL    = 15439

LOG_FILE = "deploy/migrate_catalogiq_direct_errors.log"

logging.basicConfig(filename=LOG_FILE, filemode='a',
    format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# -- SSH Tunel -----------------------------------------------------------------
def create_tunnel(transport, local_port, remote_host, remote_port):
    class _Handler(threading.Thread):
        def __init__(self, sock):
            super().__init__(daemon=True)
            self.sock = sock
        def run(self):
            try:
                chan = transport.open_channel(
                    'direct-tcpip', (remote_host, remote_port),
                    self.sock.getpeername()
                )
                def pump(src, dst):
                    try:
                        while True:
                            data = src.recv(4096)
                            if not data: break
                            dst.sendall(data)
                    except: pass
                t1 = threading.Thread(target=pump, args=(self.sock, chan), daemon=True)
                t2 = threading.Thread(target=pump, args=(chan, self.sock), daemon=True)
                t1.start(); t2.start()
                t1.join(); t2.join()
            except: pass
            finally: self.sock.close()

    srv = socket.socket()
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, True)
    srv.bind(('127.0.0.1', local_port))
    srv.listen(20)

    def _accept():
        while True:
            try:
                sock, _ = srv.accept()
                _Handler(sock).start()
            except: break

    threading.Thread(target=_accept, daemon=True).start()
    return srv

# -- Slug ----------------------------------------------------------------------
_TR = str.maketrans('csguo icsguoi', 'csguo icsguoi')
_TR2 = {'c': 'c', 's': 's', 'g': 'g', 'u': 'u', 'o': 'o',
        'i': 'i', 'C': 'C', 'S': 'S', 'G': 'G', 'U': 'U', 'O': 'O', 'I': 'I'}

def slugify(text: str) -> str:
    out = []
    for ch in text:
        if ch == 'ç': out.append('c')
        elif ch == 'ş': out.append('s')
        elif ch == 'ğ': out.append('g')
        elif ch == 'ü': out.append('u')
        elif ch == 'ö': out.append('o')
        elif ch == 'ı': out.append('i')
        elif ch == 'Ç': out.append('c')
        elif ch == 'Ş': out.append('s')
        elif ch == 'Ğ': out.append('g')
        elif ch == 'Ü': out.append('u')
        elif ch == 'Ö': out.append('o')
        elif ch == 'İ': out.append('i')
        else: out.append(ch)
    t = ''.join(out).lower()
    t = re.sub(r'[^a-z0-9\s-]', '', t)
    t = re.sub(r'[\s-]+', '-', t).strip('-')
    return t[:200] or 'urun'

# -- Brand (meta_cur: autocommit) ---------------------------------------------
def get_or_create_brand(meta_cur, name, cache: dict):
    if not name: return None
    key = name.strip().lower()[:100]
    if key in cache: return cache[key]

    meta_cur.execute(
        'SELECT "Id" FROM "Brands" WHERE LOWER("Name") = %s AND "IsDeleted" = false LIMIT 1',
        (key,)
    )
    row = meta_cur.fetchone()
    if row:
        cache[key] = str(row[0]); return cache[key]

    bid  = str(uuid.uuid4())
    slug = slugify(name.strip())
    meta_cur.execute('''
        INSERT INTO "Brands"
          ("Id","Name","Slug","IsActive","ShowInVehicleNav","IsDeleted","CreatedDate")
        VALUES (%s,%s,%s,true,false,false,NOW())
        ON CONFLICT DO NOTHING
    ''', (bid, name.strip()[:200], slug))
    # Re-fetch in case of conflict
    meta_cur.execute(
        'SELECT "Id" FROM "Brands" WHERE LOWER("Name") = %s AND "IsDeleted" = false LIMIT 1',
        (key,)
    )
    row = meta_cur.fetchone()
    cache[key] = str(row[0]) if row else bid
    return cache[key]

# -- Category (meta_cur: autocommit) ------------------------------------------
_default_cat: str | None = None

def get_or_create_category(meta_cur, path, cache: dict) -> str:
    global _default_cat
    if not path:
        return _ensure_default(meta_cur, cache)

    parts = [p.strip() for p in path.split('>') if p.strip()]
    if not parts:
        return _ensure_default(meta_cur, cache)

    parent_id = None
    for part in parts:
        key = part.lower()[:100]
        cache_key = f"{parent_id}|{key}"
        if cache_key in cache:
            parent_id = cache[cache_key]
            continue

        meta_cur.execute(
            'SELECT "Id" FROM "Categories" WHERE LOWER("Name") = %s AND "IsDeleted" = false LIMIT 1',
            (key,)
        )
        row = meta_cur.fetchone()
        if row:
            cid = str(row[0])
            cache[cache_key] = cid
            parent_id = cid
            continue

        cid  = str(uuid.uuid4())
        slug = slugify(part)
        base = slug; i = 1
        while True:
            meta_cur.execute('SELECT 1 FROM "Categories" WHERE "Slug" = %s LIMIT 1', (slug,))
            if not meta_cur.fetchone(): break
            slug = f'{base}-{i}'; i += 1

        meta_cur.execute('''
            INSERT INTO "Categories"
              ("Id","Name","Slug","ParentCategoryId","SortOrder",
               "IsActive","ShowInMenu","ShowInVehicleNav","IsDeleted","CreatedDate")
            VALUES (%s,%s,%s,%s,0,true,true,false,false,NOW())
            ON CONFLICT ("Slug") DO NOTHING
            RETURNING "Id"
        ''', (cid, part[:200], slug, parent_id))
        row = meta_cur.fetchone()
        if not row:
            meta_cur.execute(
                'SELECT "Id" FROM "Categories" WHERE "Slug" = %s LIMIT 1', (slug,)
            )
            row = meta_cur.fetchone()
        cid = str(row[0]) if row else cid
        cache[cache_key] = cid
        parent_id = cid

    return parent_id

def _ensure_default(meta_cur, cache: dict) -> str:
    global _default_cat
    if _default_cat: return _default_cat
    meta_cur.execute(
        'SELECT "Id" FROM "Categories" WHERE "Slug" = \'genel\' AND "IsDeleted" = false LIMIT 1'
    )
    row = meta_cur.fetchone()
    if row:
        _default_cat = str(row[0])
    else:
        _default_cat = str(uuid.uuid4())
        meta_cur.execute('''
            INSERT INTO "Categories"
              ("Id","Name","Slug","SortOrder","IsActive","ShowInMenu","ShowInVehicleNav","IsDeleted","CreatedDate")
            VALUES (%s,'Genel','genel',0,true,true,false,false,NOW())
            ON CONFLICT DO NOTHING
        ''', (_default_cat,))
        meta_cur.execute(
            'SELECT "Id" FROM "Categories" WHERE "Slug" = \'genel\' LIMIT 1'
        )
        row = meta_cur.fetchone()
        if row: _default_cat = str(row[0])
    cache['__default__'] = _default_cat
    return _default_cat

# -- Product upsert (prod_cur: batched transaction) ---------------------------
def upsert_product(prod_cur, row: dict, brand_id, cat_id, sku_counter: dict):
    sku   = row['sku']
    name  = (row['title'] or '').strip()[:300]
    price = float(row['price']) if row['price'] else 0
    if not name or price <= 0: return None, None

    prod_cur.execute(
        'SELECT "Id", "Name" FROM "Products" WHERE "SKU" = %s AND "IsDeleted" = false LIMIT 1',
        (sku,)
    )
    existing = prod_cur.fetchone()

    if existing:
        pid = str(existing[0])
        existing_name = (existing[1] or '').strip()
        if existing_name.lower() == name.lower():
            # Same product — UPDATE
            prod_cur.execute('''
                UPDATE "Products" SET
                  "Name"=%s,"BrandId"=%s,"CategoryId"=%s,"Price"=%s,
                  "Description"=%s,"ShortDescription"=%s,"Currency"=%s,"UpdatedDate"=NOW()
                WHERE "Id"=%s
            ''', (name, brand_id, cat_id, price,
                  row.get('long_description'), row.get('short_description'),
                  row.get('currency') or 'TRY', pid))
            return pid, sku
        else:
            # Different product with same SKU — generate unique SKU
            base = sku
            sku_counter[base] = sku_counter.get(base, 1) + 1
            sku = f'{base}-v{sku_counter[base]}'
            while True:
                prod_cur.execute(
                    'SELECT 1 FROM "Products" WHERE "SKU"=%s AND "IsDeleted"=false LIMIT 1',
                    (sku,)
                )
                if not prod_cur.fetchone():
                    break
                sku_counter[base] += 1
                sku = f'{base}-v{sku_counter[base]}'

    slug = slugify(name); base_slug = slug; i = 1
    while True:
        prod_cur.execute('SELECT 1 FROM "Products" WHERE "Slug" = %s LIMIT 1', (slug,))
        if not prod_cur.fetchone(): break
        slug = f'{base_slug}-{i}'; i += 1

    pid = str(uuid.uuid4())
    prod_cur.execute('''
        INSERT INTO "Products"
          ("Id","Name","Slug","SKU","Barcode","Description","ShortDescription",
           "BrandId","CategoryId","Price","Currency","TaxRate",
           "ProductType","IsActive","IsPublished","IsFeatured","IsDeleted",
           "DataSource","CreatedDate")
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0,0,true,true,false,false,'catalogiq',NOW())
    ''', (pid, name, slug, sku, row.get('barcode'),
          row.get('long_description'), row.get('short_description'),
          brand_id, cat_id, price, row.get('currency') or 'TRY'))
    return pid, sku

def upsert_variant(prod_cur, prod_id: str, actual_sku: str, row: dict):
    # Check by ProductId — each product has exactly one Standart variant
    prod_cur.execute(
        'SELECT 1 FROM "ProductVariants" WHERE "ProductId" = %s AND "IsDeleted" = false LIMIT 1',
        (prod_id,)
    )
    if prod_cur.fetchone(): return
    price = float(row['price']) if row['price'] else 0
    prod_cur.execute('''
        INSERT INTO "ProductVariants"
          ("Id","ProductId","VariantName","SKU","Barcode","Price",
           "IsActive","AttributesJson","IsDeleted","CreatedDate")
        VALUES (%s,%s,'Standart',%s,%s,%s,true,'[]',false,NOW())
        ON CONFLICT DO NOTHING
    ''', (str(uuid.uuid4()), prod_id, actual_sku, row.get('barcode'), price))

def insert_images(prod_cur, prod_id: str, row: dict):
    urls = row.get('image_urls') or []
    if not urls: return
    prod_cur.execute(
        'SELECT 1 FROM "ProductImages" WHERE "ProductId" = %s AND "IsDeleted" = false LIMIT 1',
        (prod_id,)
    )
    if prod_cur.fetchone(): return
    for i, url in enumerate(urls[:10]):
        prod_cur.execute('''
            INSERT INTO "ProductImages"
              ("Id","ProductId","ImageUrl","SortOrder","IsMain","IsDeleted","CreatedDate")
            VALUES (%s,%s,%s,%s,%s,false,NOW())
        ''', (str(uuid.uuid4()), prod_id, url, i, i == 0))

# -- Fetch from CatalogIQ -----------------------------------------------------
def fetch_batch(ciq_cur, offset: int, batch_size: int) -> list:
    ciq_cur.execute('''
        SELECT "Title" AS title, "Sku" AS sku, "PriceCurrent" AS price,
               "ShortDescription" AS short_description, "LongDescription" AS long_description,
               "CategoryPath" AS category_path, "Brand" AS brand,
               "ImageUrls" AS image_urls, "Barcode" AS barcode,
               "StockStatus" AS stock_status, "Currency" AS currency
        FROM "NormalizedProducts"
        WHERE "SourceSiteId" = %s AND "IsDeleted" = false
          AND "Title" IS NOT NULL AND "Sku" IS NOT NULL AND "PriceCurrent" > 0
        ORDER BY "Id"
        LIMIT %s OFFSET %s
    ''', (SITE_ID, batch_size, offset))
    cols = [d[0] for d in ciq_cur.description]
    return [dict(zip(cols, r)) for r in ciq_cur.fetchall()]

# -- Main ---------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--batch',  type=int, default=1000)
    parser.add_argument('--offset', type=int, default=0)
    args = parser.parse_args()

    print(f'SSH connecting -> {BULUTX_HOST}...')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(BULUTX_HOST, username=BULUTX_USER, password=BULUTX_PASS, timeout=15)

    _, out, _ = ssh.exec_command(
        "grep '^POSTGRES_PASSWORD=' /opt/ecom/.env | cut -d= -f2-", timeout=10
    )
    pg_pass = out.read().decode().strip()

    print(f'SSH tunnel -> {PG_CONTAINER_IP}:{PG_PORT} (local:{LOCAL_TUNNEL})...')
    tunnel = create_tunnel(ssh.get_transport(), LOCAL_TUNNEL, PG_CONTAINER_IP, PG_PORT)
    time.sleep(0.5)

    def connect_ecom():
        return psycopg2.connect(
            host='127.0.0.1', port=LOCAL_TUNNEL,
            dbname=PG_DB, user=PG_USER, password=pg_pass,
            connect_timeout=15
        )

    print('CatalogIQ connecting...')
    ciq_conn = psycopg2.connect(CATALOGIQ_DSN)
    ciq_cur  = ciq_conn.cursor()

    print('Bulutx EcomDb connecting...')
    # meta: autocommit (brands/categories commit immediately)
    meta_conn = connect_ecom()
    meta_conn.autocommit = True
    meta_cur = meta_conn.cursor()

    # prod: batched transactions
    prod_conn = connect_ecom()
    prod_conn.autocommit = False
    prod_cur = prod_conn.cursor()

    ciq_cur.execute(
        'SELECT COUNT(*) FROM "NormalizedProducts" WHERE "SourceSiteId"=%s'
        ' AND "IsDeleted"=false AND "Title" IS NOT NULL AND "Sku" IS NOT NULL AND "PriceCurrent">0',
        (SITE_ID,)
    )
    total = ciq_cur.fetchone()[0]
    print(f'\nTotal CatalogIQ products: {total:,}')
    print(f'Batch: {args.batch} | Start offset: {args.offset:,}')
    print('-' * 60)
    sys.stdout.flush()

    brand_cache: dict = {}
    cat_cache:   dict = {}
    sku_counter: dict = {}
    ok = err = skip = 0
    offset = args.offset
    start  = time.time()

    while True:
        rows = fetch_batch(ciq_cur, offset, args.batch)
        if not rows:
            break

        for row in rows:
            try:
                brand_id = get_or_create_brand(meta_cur, row.get('brand'), brand_cache)
                cat_id   = get_or_create_category(meta_cur, row.get('category_path'), cat_cache)
                prod_id, actual_sku = upsert_product(prod_cur, row, brand_id, cat_id, sku_counter)
                if prod_id:
                    upsert_variant(prod_cur, prod_id, actual_sku, row)
                    insert_images(prod_cur, prod_id, row)
                    ok += 1
                else:
                    skip += 1
            except Exception as e:
                err += 1
                logger.error('SKU=%s %s', row.get('sku', '?'), e)
                try:
                    prod_conn.rollback()
                except Exception:
                    pass

        try:
            prod_conn.commit()
        except Exception as e:
            logger.error('COMMIT hatasi: %s', e)
            prod_conn.rollback()

        offset  += len(rows)
        elapsed  = time.time() - start
        rate     = offset / elapsed if elapsed > 0 else 0
        remaining = (total - offset) / rate if rate > 0 else 0
        print(
            f'[{time.strftime("%H:%M:%S")}] {offset:>7,}/{total:,} | '
            f'+{ok:,} >{skip:,} !{err:,} | '
            f'{rate:.0f}/sn | ~{remaining/60:.1f}dk',
            flush=True
        )

    ciq_cur.close();  ciq_conn.close()
    meta_cur.close(); meta_conn.close()
    prod_cur.close(); prod_conn.close()
    tunnel.close();   ssh.close()

    elapsed = time.time() - start
    print('-' * 60)
    print(f'Done: +{ok:,} processed | >{skip:,} skipped | !{err:,} errors | {elapsed/60:.1f} min')
    if err:
        print(f'Error log: {LOG_FILE}')


if __name__ == '__main__':
    main()
