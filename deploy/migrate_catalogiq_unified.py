# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
CatalogIQ -> Ecom ürün migrasyon scripti (unified, hizli).

Hedef: --target local (varsayilan) veya --target bulutx

Duplikat kontrol:
  1. SKU eslesme (in-memory index):  ayni SKU + ayni isim -> UPDATE
                                      ayni SKU + farkli isim -> -vN suffix
  2. Name+DataSource eslesme (in-memory): ayni isim, catalogiq kaynak -> UPDATE
  3. Hicbiri yoksa: INSERT

Hiz optimizasyonu:
  - Baslatma sirasinda tum urun SKU / isim / slug setleri belleğe yuklenir.
  - Per-row SELECT elimine edilir; DB'ye sadece INSERT/UPDATE yazilir.
  - autocommit=True ile transaction overhead sifira indirilir.

Kullanim:
  python deploy/migrate_catalogiq_unified.py
  python deploy/migrate_catalogiq_unified.py --target bulutx
  python deploy/migrate_catalogiq_unified.py --batch 2000 --offset 50000
"""
import argparse, re, time, logging, uuid, socket, threading

import psycopg2

# -- Konfigurasyon -------------------------------------------------------------
CATALOGIQ_DSN = "host=127.0.0.1 port=5436 dbname=catalogiq user=catalogiq password=catalogiq"
SITE_ID       = "bc87db68-ebd1-4a35-8656-75ba5b422d72"

LOCAL_PG_DSN  = "host=127.0.0.1 port=5435 dbname=EcomDb user=ecom password=ecom_dev_2026"

BULUTX_HOST      = "31.210.40.242"
BULUTX_SSH_USER  = "bilgi"
BULUTX_SSH_PASS  = "nAqAcUFeb9vUbruMon0b!"
PG_CONTAINER_IP  = "172.18.0.4"
PG_PORT          = 5432
PG_DB            = "EcomDb"
PG_USER          = "ecom"
LOCAL_TUNNEL     = 15439

LOG_FILE = "deploy/migrate_catalogiq_unified_errors.log"

logging.basicConfig(
    filename=LOG_FILE, filemode='a',
    format='%(asctime)s %(levelname)s %(message)s'
)
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
def slugify(text: str) -> str:
    out = []
    tr_map = {'ç':'c','ş':'s','ğ':'g','ü':'u','ö':'o','ı':'i',
               'Ç':'c','Ş':'s','Ğ':'g','Ü':'u','Ö':'o','İ':'i'}
    for ch in text:
        out.append(tr_map.get(ch, ch))
    t = ''.join(out).lower()
    t = re.sub(r'[^a-z0-9\s-]', '', t)
    t = re.sub(r'[\s-]+', '-', t).strip('-')
    return t[:200] or 'urun'


# -- Index yukleme (baslangicta bir kez) --------------------------------------
def load_indexes(cur) -> tuple[dict, dict, set]:
    """
    Donus:
      sku_index  : {sku_upper: {'id': str, 'name': str}}
      name_index : {lower_name: {'id': str, 'sku': str}}  — yalnizca DataSource='catalogiq'
      slug_set   : set of all product slugs
    """
    print('Mevcut urun indexleri belleğe yukleniyor...', flush=True)
    t0 = time.time()

    sku_index  = {}
    name_index = {}
    slug_set   = set()

    cur.execute('''
        SELECT "Id", UPPER("SKU"), "Name", "Slug", "DataSource"
        FROM "Products"
        WHERE "IsDeleted" = false AND "SKU" IS NOT NULL
    ''')
    for pid, sku_up, name, slug, datasource in cur.fetchall():
        if sku_up:
            sku_index[sku_up] = {'id': str(pid), 'name': name or ''}
        if slug:
            slug_set.add(slug)
        if datasource == 'catalogiq' and name:
            name_index[name.strip().lower()] = {'id': str(pid), 'sku': sku_up or ''}

    # Sluglari da yukle (SKU'su olmayan urunler icin)
    cur.execute('SELECT "Slug" FROM "Products" WHERE "IsDeleted" = false AND "SKU" IS NULL')
    for (slug,) in cur.fetchall():
        if slug:
            slug_set.add(slug)

    print(f'  SKU index: {len(sku_index):,} | Name index: {len(name_index):,} | Slug set: {len(slug_set):,} | {time.time()-t0:.1f}s', flush=True)
    return sku_index, name_index, slug_set


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
        cache[key] = str(row[0])
        return cache[key]

    bid  = str(uuid.uuid4())
    slug = slugify(name.strip())
    meta_cur.execute('''
        INSERT INTO "Brands"
          ("Id","Name","Slug","IsActive","ShowInVehicleNav","IsDeleted","CreatedDate")
        VALUES (%s,%s,%s,true,false,false,NOW())
        ON CONFLICT DO NOTHING
    ''', (bid, name.strip()[:200], slug))
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
        key       = part.lower()[:100]
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

        cid       = str(uuid.uuid4())
        slug      = slugify(part)
        base_slug = slug; i = 1
        while True:
            meta_cur.execute('SELECT 1 FROM "Categories" WHERE "Slug" = %s LIMIT 1', (slug,))
            if not meta_cur.fetchone(): break
            slug = f'{base_slug}-{i}'; i += 1

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
            meta_cur.execute('SELECT "Id" FROM "Categories" WHERE "Slug" = %s LIMIT 1', (slug,))
            row = meta_cur.fetchone()
        cid = str(row[0]) if row else cid
        cache[cache_key] = cid
        parent_id = cid

    return parent_id


def _ensure_default(meta_cur, cache: dict) -> str:
    global _default_cat
    if _default_cat: return _default_cat
    meta_cur.execute(
        "SELECT \"Id\" FROM \"Categories\" WHERE \"Slug\" = 'genel' AND \"IsDeleted\" = false LIMIT 1"
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
        meta_cur.execute("SELECT \"Id\" FROM \"Categories\" WHERE \"Slug\" = 'genel' LIMIT 1")
        row = meta_cur.fetchone()
        if row: _default_cat = str(row[0])
    cache['__default__'] = _default_cat
    return _default_cat


# -- Benzersiz slug uretici (in-memory) ----------------------------------------
def unique_slug(base: str, slug_set: set) -> str:
    slug = base; i = 1
    while slug in slug_set:
        slug = f'{base}-{i}'; i += 1
    slug_set.add(slug)
    return slug


# -- Benzersiz SKU uretici (in-memory) ----------------------------------------
def unique_sku_suffix(base_sku: str, sku_index: dict, sku_counter: dict) -> str:
    sku_counter[base_sku] = sku_counter.get(base_sku, 1) + 1
    candidate = f'{base_sku}-v{sku_counter[base_sku]}'
    while candidate.upper() in sku_index:
        sku_counter[base_sku] += 1
        candidate = f'{base_sku}-v{sku_counter[base_sku]}'
    return candidate


# -- Product upsert (in-memory index kullanir) ----------------------------------
def upsert_product(prod_cur, row: dict, brand_id, cat_id,
                   sku_index: dict, name_index: dict, slug_set: set, sku_counter: dict):
    """
    Donus: (prod_id, actual_sku, action)
    action: 'insert' | 'update_sku' | 'update_name' | 'skip'
    """
    raw_sku = (row['sku'] or '').strip()[:100]
    name    = (row['title'] or '').strip()[:300]
    price   = float(row['price']) if row['price'] else 0

    if not name or price <= 0:
        return None, None, 'skip'

    actual_sku = raw_sku

    # --- Katman 1: SKU kontrolu (in-memory) ---
    if raw_sku:
        sku_up  = raw_sku.upper()
        existing = sku_index.get(sku_up)
        if existing:
            pid           = existing['id']
            existing_name = existing['name'].strip()
            if existing_name.lower() == name.lower():
                # Ayni urun -> UPDATE
                prod_cur.execute('''
                    UPDATE "Products" SET
                      "Name"=%s,"BrandId"=%s,"CategoryId"=%s,"Price"=%s,
                      "Description"=%s,"ShortDescription"=%s,"Currency"=%s,"UpdatedDate"=NOW()
                    WHERE "Id"=%s
                ''', (name, brand_id, cat_id, price,
                      row.get('long_description'), row.get('short_description'),
                      row.get('currency') or 'TRY', pid))
                sku_index[sku_up]['name'] = name
                return pid, actual_sku, 'update_sku'
            else:
                # Farkli urun, ayni SKU -> yeni suffix
                actual_sku = unique_sku_suffix(raw_sku, sku_index, sku_counter)

    # --- Katman 2: Name + DataSource kontrolu (in-memory) ---
    name_key = name.lower()
    name_match = name_index.get(name_key)
    if name_match:
        pid = name_match['id']
        prod_cur.execute('''
            UPDATE "Products" SET
              "BrandId"=%s,"CategoryId"=%s,"Price"=%s,
              "Description"=%s,"ShortDescription"=%s,"Currency"=%s,"UpdatedDate"=NOW()
            WHERE "Id"=%s
        ''', (brand_id, cat_id, price,
              row.get('long_description'), row.get('short_description'),
              row.get('currency') or 'TRY', pid))
        return pid, actual_sku or None, 'update_name'

    # --- Katman 3: INSERT (ON CONFLICT: SKU cakismasi DB'den guvenceli yakala) ---
    slug = unique_slug(slugify(name), slug_set)
    pid  = str(uuid.uuid4())
    prod_cur.execute('''
        INSERT INTO "Products"
          ("Id","Name","Slug","SKU","Barcode","Description","ShortDescription",
           "BrandId","CategoryId","Price","Currency","TaxRate",
           "ProductType","IsActive","IsPublished","IsFeatured","IsDeleted",
           "DataSource","CreatedDate")
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0,0,true,true,false,false,'catalogiq',NOW())
        ON CONFLICT ("SKU") DO NOTHING
        RETURNING "Id"
    ''', (pid, name, slug, actual_sku or None, row.get('barcode'),
          row.get('long_description'), row.get('short_description'),
          brand_id, cat_id, price, row.get('currency') or 'TRY'))

    inserted_row = prod_cur.fetchone()

    if inserted_row:
        # Basarili INSERT
        pid = str(inserted_row[0])
        if actual_sku:
            sku_index[actual_sku.upper()] = {'id': pid, 'name': name}
        name_index[name_key] = {'id': pid, 'sku': actual_sku or ''}
        return pid, actual_sku or None, 'insert'

    # ON CONFLICT DO NOTHING devreye girdi: SKU zaten var, UPDATE yap
    if actual_sku:
        prod_cur.execute(
            'SELECT "Id" FROM "Products" WHERE "SKU" = %s AND "IsDeleted" = false LIMIT 1',
            (actual_sku,)
        )
        conflict_row = prod_cur.fetchone()
        if conflict_row:
            pid = str(conflict_row[0])
            prod_cur.execute('''
                UPDATE "Products" SET
                  "BrandId"=%s,"CategoryId"=%s,"Price"=%s,
                  "Description"=%s,"ShortDescription"=%s,"Currency"=%s,"UpdatedDate"=NOW()
                WHERE "Id"=%s
            ''', (brand_id, cat_id, price,
                  row.get('long_description'), row.get('short_description'),
                  row.get('currency') or 'TRY', pid))
            sku_index[actual_sku.upper()] = {'id': pid, 'name': name}
            name_index[name_key] = {'id': pid, 'sku': actual_sku}
            return pid, actual_sku, 'update_sku_conflict'

    return None, None, 'skip'


def upsert_variant(prod_cur, prod_id: str, actual_sku, row: dict, sku_index: dict):
    prod_cur.execute(
        'SELECT "Id", "Price" FROM "ProductVariants" WHERE "ProductId" = %s AND "IsDeleted" = false LIMIT 1',
        (prod_id,)
    )
    existing = prod_cur.fetchone()
    price = float(row['price']) if row['price'] else 0

    if existing:
        # SKU degistirme — sadece fiyati guncelle (SKU conflict onleme)
        prod_cur.execute(
            'UPDATE "ProductVariants" SET "Price"=%s,"UpdatedDate"=NOW() WHERE "Id"=%s',
            (price, str(existing[0]))
        )
        return

    prod_cur.execute('''
        INSERT INTO "ProductVariants"
          ("Id","ProductId","VariantName","SKU","Barcode","Price",
           "IsActive","AttributesJson","IsDeleted","CreatedDate")
        VALUES (%s,%s,'Standart',%s,%s,%s,true,'[]',false,NOW())
        ON CONFLICT DO NOTHING
    ''', (str(uuid.uuid4()), prod_id, actual_sku, row.get('barcode'), price))


def insert_images(prod_cur, prod_id: str, row: dict, img_cache: set):
    if prod_id in img_cache:
        return
    urls = row.get('image_urls') or []
    if not urls:
        return
    img_cache.add(prod_id)
    for i, url in enumerate(urls[:10]):
        prod_cur.execute('''
            INSERT INTO "ProductImages"
              ("Id","ProductId","ImageUrl","SortOrder","IsMain","IsDeleted","CreatedDate")
            VALUES (%s,%s,%s,%s,%s,false,NOW())
            ON CONFLICT DO NOTHING
        ''', (str(uuid.uuid4()), prod_id, url, i, i == 0))


# -- CatalogIQ fetch -----------------------------------------------------------
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


# -- Main ----------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', choices=['local', 'bulutx'], default='local')
    parser.add_argument('--batch',  type=int, default=2000)
    parser.add_argument('--offset', type=int, default=0)
    args = parser.parse_args()

    ssh = tunnel = None

    if args.target == 'bulutx':
        import paramiko
        print(f'SSH baglaniyor -> {BULUTX_HOST}...')
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(BULUTX_HOST, username=BULUTX_SSH_USER, password=BULUTX_SSH_PASS, timeout=15)

        _, out, _ = ssh.exec_command(
            "grep '^POSTGRES_PASSWORD=' /opt/ecom/.env | cut -d= -f2-", timeout=10
        )
        pg_pass = out.read().decode().strip()
        print(f'SSH tunel -> {PG_CONTAINER_IP}:{PG_PORT} (local:{LOCAL_TUNNEL})...')
        tunnel = create_tunnel(ssh.get_transport(), LOCAL_TUNNEL, PG_CONTAINER_IP, PG_PORT)
        time.sleep(0.5)

        def make_conn():
            return psycopg2.connect(
                host='127.0.0.1', port=LOCAL_TUNNEL,
                dbname=PG_DB, user=PG_USER, password=pg_pass,
                connect_timeout=15
            )
    else:
        def make_conn():
            return psycopg2.connect(LOCAL_PG_DSN, connect_timeout=15)

    # Baglantilari kur
    print(f'CatalogIQ baglaniyor...')
    ciq_conn = psycopg2.connect(CATALOGIQ_DSN)
    ciq_cur  = ciq_conn.cursor()

    print(f'Ecom DB baglaniyor ({args.target})...')
    meta_conn = make_conn(); meta_conn.autocommit = True
    meta_cur  = meta_conn.cursor()

    prod_conn = make_conn(); prod_conn.autocommit = True  # per-row commit
    prod_cur  = prod_conn.cursor()

    idx_conn = make_conn(); idx_conn.autocommit = True
    idx_cur  = idx_conn.cursor()

    # Kaynak ve hedef sayilari
    ciq_cur.execute(
        'SELECT COUNT(*) FROM "NormalizedProducts" WHERE "SourceSiteId"=%s'
        ' AND "IsDeleted"=false AND "Title" IS NOT NULL AND "Sku" IS NOT NULL AND "PriceCurrent">0',
        (SITE_ID,)
    )
    total = ciq_cur.fetchone()[0]

    idx_cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
    ecom_before = idx_cur.fetchone()[0]

    # In-memory indexleri yukle
    sku_index, name_index, slug_set = load_indexes(idx_cur)

    # Mevcut gorsel sahibi urun IDlerini yukle (on conflict skip icin)
    idx_cur.execute('SELECT DISTINCT "ProductId" FROM "ProductImages" WHERE "IsDeleted"=false')
    img_cache = set(str(r[0]) for r in idx_cur.fetchall())

    idx_cur.close(); idx_conn.close()

    print(f'\nCatalogIQ toplam: {total:,} kayit')
    print(f'Ecom mevcut:      {ecom_before:,} urun')
    print(f'Batch: {args.batch} | Baslangic offset: {args.offset:,}')
    print(f'Hedef: {args.target.upper()}')
    print('-' * 70)
    sys.stdout.flush()

    brand_cache: dict = {}
    cat_cache:   dict = {}
    sku_counter: dict = {}

    inserted = updated_sku = updated_name = skipped = err = 0
    offset   = args.offset
    start    = time.time()
    last_report = start

    while True:
        rows = fetch_batch(ciq_cur, offset, args.batch)
        if not rows: break

        for row in rows:
            try:
                brand_id = get_or_create_brand(meta_cur, row.get('brand'), brand_cache)
                cat_id   = get_or_create_category(meta_cur, row.get('category_path'), cat_cache)
                prod_id, actual_sku, action = upsert_product(
                    prod_cur, row, brand_id, cat_id,
                    sku_index, name_index, slug_set, sku_counter
                )
                if action == 'skip' or prod_id is None:
                    skipped += 1
                    continue

                upsert_variant(prod_cur, prod_id, actual_sku, row, sku_index)
                insert_images(prod_cur, prod_id, row, img_cache)

                if action == 'insert':
                    inserted += 1
                elif action in ('update_sku', 'update_sku_conflict'):
                    updated_sku += 1
                elif action == 'update_name':
                    updated_name += 1

            except Exception as e:
                err += 1
                logger.error('SKU=%s TITLE=%s ERR=%s',
                             row.get('sku', '?'), (row.get('title') or '')[:60], e)

        offset += len(rows)
        now = time.time()
        if now - last_report >= 30:
            elapsed   = now - start
            rate      = (offset - args.offset) / elapsed if elapsed > 0 else 0
            remaining = (total - offset) / rate if rate > 0 else 0
            print(
                f'[{time.strftime("%H:%M:%S")}] {offset:>8,}/{total:,} | '
                f'INS={inserted:,} UPD_SKU={updated_sku:,} UPD_NM={updated_name:,} '
                f'SKIP={skipped:,} ERR={err:,} | '
                f'{rate:.0f}/sn | ~{remaining/60:.1f}dk',
                flush=True
            )
            last_report = now

    # Final sayim
    idx2 = make_conn(); idx2.autocommit = True
    c2   = idx2.cursor()
    c2.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
    ecom_after = c2.fetchone()[0]
    c2.close(); idx2.close()

    ciq_cur.close();  ciq_conn.close()
    meta_cur.close(); meta_conn.close()
    prod_cur.close(); prod_conn.close()
    if tunnel: tunnel.close()
    if ssh:    ssh.close()

    elapsed = time.time() - start
    print()
    print('=' * 70)
    print(f'MIGRASYON TAMAMLANDI [{args.target.upper()}]')
    print(f'  Sure:              {elapsed/60:.1f} dakika')
    print(f'  Kaynak:            {total:,} CatalogIQ kaydi')
    print(f'  Eklenen (yeni):    {inserted:,}')
    print(f'  Guncellenen (SKU): {updated_sku:,}')
    print(f'  Guncellenen (Isim):{updated_name:,}')
    print(f'  Atlanan:           {skipped:,} (bos/gecersiz veri)')
    print(f'  Hata:              {err:,}')
    print(f'  Ecom oncesi:       {ecom_before:,} urun')
    print(f'  Ecom sonrasi:      {ecom_after:,} urun')
    print(f'  Net artis:         +{ecom_after - ecom_before:,}')
    print('=' * 70)
    if err:
        print(f'Hata log: {LOG_FILE}')


if __name__ == '__main__':
    main()
