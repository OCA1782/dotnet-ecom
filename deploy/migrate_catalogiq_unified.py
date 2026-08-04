# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
CatalogIQ -> Ecom urun migrasyon scripti (unified, hizli, izlenebilir).

Hedef: --target local | bulutx | both

Takip:
  CatalogIQ DB'sinde "migration_log_local" ve "migration_log_bulutx" tablolari
  ile hangi urunlerin aktarildigini kaydeder.
  Tekrar calistirmada zaten aktarilmis urunler atlanir (cok hizli skip).

Duplikat kontrol:
  1. SKU eslesme (in-memory index):  ayni SKU + ayni isim -> UPDATE
                                     ayni SKU + farkli isim -> parca kodlu suffix
  2. Name+DataSource eslesme (in-memory): ayni isim, catalogiq kaynak -> UPDATE
  3. Hicbiri yoksa: INSERT

Hiz optimizasyonu:
  - Baslatma sirasinda tum urun SKU / isim / slug setleri belleye yuklenir.
  - Per-row SELECT elimine edilir; DB'ye sadece INSERT/UPDATE yazilir.
  - autocommit=True ile transaction overhead sifira indirilir.
  - --target both: local ve bulutx ayni anda paralel calisir.

Kullanim:
  python deploy/migrate_catalogiq_unified.py
  python deploy/migrate_catalogiq_unified.py --target bulutx
  python deploy/migrate_catalogiq_unified.py --target both
  python deploy/migrate_catalogiq_unified.py --batch 2000 --offset 50000
"""
import argparse, re, time, logging, uuid, socket, threading, sys as _sys

import psycopg2
import psycopg2.errors

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

_print_lock = threading.Lock()

def tprint(*args, **kwargs):
    with _print_lock:
        print(*args, **kwargs)
        sys.stdout.flush()


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


def setup_bulutx_tunnel(local_port: int):
    """SSH baglantisi kurar, pg_pass ve tunnel dondurur."""
    import paramiko
    tprint(f'SSH baglaniyor -> {BULUTX_HOST}...')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(BULUTX_HOST, username=BULUTX_SSH_USER, password=BULUTX_SSH_PASS, timeout=15)
    _, out, _ = ssh.exec_command(
        "grep '^POSTGRES_PASSWORD=' /opt/ecom/.env | cut -d= -f2-", timeout=10
    )
    pg_pass = out.read().decode().strip()
    tprint(f'SSH tunel -> {PG_CONTAINER_IP}:{PG_PORT} (local:{local_port})...')
    tunnel = create_tunnel(ssh.get_transport(), local_port, PG_CONTAINER_IP, PG_PORT)
    time.sleep(0.5)
    return ssh, tunnel, pg_pass


# -- Slug ----------------------------------------------------------------------
def slugify(text: str) -> str:
    out = []
    tr_map = {'c':'c','s':'s','g':'g','u':'u','o':'o','i':'i',
               'C':'c','S':'s','G':'g','U':'u','O':'o','I':'i',
               'ç':'c','ş':'s','ğ':'g','ü':'u','ö':'o','ı':'i',
               'Ç':'c','Ş':'s','Ğ':'g','Ü':'u','Ö':'o','İ':'i'}
    for ch in text:
        out.append(tr_map.get(ch, ch))
    t = ''.join(out).lower()
    t = re.sub(r'[^a-z0-9\s-]', '', t)
    t = re.sub(r'[\s-]+', '-', t).strip('-')
    return t[:200] or 'urun'


# -- Migration takip tablolari (CatalogIQ DB) ----------------------------------
def ensure_tracking_table(ciq_cur, target: str):
    table = f'migration_log_{target}'
    ciq_cur.execute(f'''
        CREATE TABLE IF NOT EXISTS "{table}" (
            normalized_product_id UUID        PRIMARY KEY,
            ecom_product_id       UUID,
            ecom_sku              VARCHAR(100),
            action                VARCHAR(30),
            migrated_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMP   NOT NULL DEFAULT NOW()
        )
    ''')
    ciq_cur.execute(
        f'CREATE INDEX IF NOT EXISTS "ix_{table}_ecom_id" ON "{table}" (ecom_product_id)'
    )


def load_migrated_ids(ciq_cur, target: str) -> set:
    table = f'migration_log_{target}'
    ciq_cur.execute(f'SELECT normalized_product_id FROM "{table}"')
    return set(r[0] for r in ciq_cur.fetchall())


def log_migration(log_cur, target: str, ciq_id: str, ecom_id: str, sku, action: str):
    table = f'migration_log_{target}'
    log_cur.execute(f'''
        INSERT INTO "{table}"
          (normalized_product_id, ecom_product_id, ecom_sku, action, migrated_at, updated_at)
        VALUES (%s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (normalized_product_id) DO UPDATE SET
            ecom_product_id = EXCLUDED.ecom_product_id,
            ecom_sku        = EXCLUDED.ecom_sku,
            action          = EXCLUDED.action,
            updated_at      = NOW()
    ''', (ciq_id, ecom_id, sku, action))


# -- Index yukleme (baslangicta bir kez) ---------------------------------------
def load_indexes(cur, prefix: str) -> tuple[dict, dict, set]:
    tprint(f'{prefix} Ecom urun indexleri belleye yukleniyor...')
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

    cur.execute('SELECT "Slug" FROM "Products" WHERE "IsDeleted" = false AND "SKU" IS NULL')
    for (slug,) in cur.fetchall():
        if slug:
            slug_set.add(slug)

    # ProductVariants SKU'lari — unique_sku_suffix conflict onlemek icin
    cur.execute('SELECT UPPER("SKU") FROM "ProductVariants" WHERE "IsDeleted" = false AND "SKU" IS NOT NULL')
    variant_count = 0
    for (sku_up,) in cur.fetchall():
        if sku_up and sku_up not in sku_index:
            sku_index[sku_up] = {'id': '__variant__', 'name': ''}
            variant_count += 1

    tprint(
        f'{prefix} SKU index: {len(sku_index):,} (variant-only: {variant_count:,}) | '
        f'Name index: {len(name_index):,} | Slug set: {len(slug_set):,} | {time.time()-t0:.1f}s'
    )
    return sku_index, name_index, slug_set


# -- Brand ---------------------------------------------------------------------
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
    meta_cur.execute(
        'SELECT "Id" FROM "Brands" WHERE LOWER("Name") = %s AND "IsDeleted" = false LIMIT 1',
        (key,)
    )
    row = meta_cur.fetchone()
    cache[key] = str(row[0]) if row else bid
    return cache[key]


# -- Category ------------------------------------------------------------------
def get_or_create_category(meta_cur, path, cat_cache: dict) -> str:
    if not path:
        return _ensure_default(meta_cur, cat_cache)
    parts = [p.strip() for p in path.split('>') if p.strip()]
    if not parts:
        return _ensure_default(meta_cur, cat_cache)

    parent_id = None
    for part in parts:
        key       = part.lower()[:100]
        cache_key = f"{parent_id}|{key}"
        if cache_key in cat_cache:
            parent_id = cat_cache[cache_key]; continue

        meta_cur.execute(
            'SELECT "Id" FROM "Categories" WHERE LOWER("Name") = %s AND "IsDeleted" = false LIMIT 1',
            (key,)
        )
        row = meta_cur.fetchone()
        if row:
            cid = str(row[0]); cat_cache[cache_key] = cid; parent_id = cid; continue

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
        cat_cache[cache_key] = cid; parent_id = cid

    return parent_id


def _ensure_default(meta_cur, cat_cache: dict) -> str:
    if '__default__' in cat_cache:
        return cat_cache['__default__']

    meta_cur.execute(
        "SELECT \"Id\" FROM \"Categories\" WHERE \"Slug\" = 'genel' AND \"IsDeleted\" = false LIMIT 1"
    )
    row = meta_cur.fetchone()
    if row:
        cat_cache['__default__'] = str(row[0])
    else:
        did = str(uuid.uuid4())
        meta_cur.execute('''
            INSERT INTO "Categories"
              ("Id","Name","Slug","SortOrder","IsActive","ShowInMenu","ShowInVehicleNav","IsDeleted","CreatedDate")
            VALUES (%s,'Genel','genel',0,true,true,false,false,NOW())
            ON CONFLICT DO NOTHING
        ''', (did,))
        meta_cur.execute("SELECT \"Id\" FROM \"Categories\" WHERE \"Slug\" = 'genel' LIMIT 1")
        row = meta_cur.fetchone()
        cat_cache['__default__'] = str(row[0]) if row else did

    return cat_cache['__default__']


# -- SKU suffix ----------------------------------------------------------------
_SKIP_WORDS = {
    've', 'ile', 'icin', 'on', 'arka', 'sol', 'sag', 'adet', 'takim',
    'kiti', 'seti', 'marka', 'orijinal', 'urun', 'komple',
    'model', 'sonrasi', 'oncesi', 'arasi', 'serisi', 'benzinli',
    'dizel', 'turbo', 'otomatik', 'manuel', 'cift', 'tek',
}

def extract_part_code(base_sku: str, name: str):
    """
    Baslik formatindan parca kodu ya da arac bilgisi cikarir.
    "FEBI BILSTEIN 39677 | Rot Takimi On Sol BMW"  ->  "39677"
    "MANN W712-95 | Seat Leon Yag Filtresi"        ->  "SEAT-LEON"
    """
    if not name: return None
    name = name.strip()
    if '|' in name:
        before = name.split('|')[0].strip()
        after  = name.split('|', 1)[1].strip()
        tokens = before.split()
        if tokens:
            last = tokens[-1].strip('()[].,')
            if last and last.upper() != base_sku.upper() and len(last) >= 2:
                if not (len(last) <= 2 and last.isdigit()):
                    return last
        tokens_after = [t.strip('()[].,/-') for t in after.split()]
        meaningful = []
        for t in tokens_after:
            if (len(t) >= 3
                    and not t.replace('.', '').replace('-', '').isdigit()
                    and t.lower() not in _SKIP_WORDS):
                meaningful.append(t.upper())
            if len(meaningful) >= 2: break
        if meaningful: return '-'.join(meaningful)
    tokens = name.split()
    meaningful = []
    for t in tokens[:8]:
        t2 = t.strip('()[].,|/-')
        if (len(t2) >= 3
                and not t2.replace('.', '').replace('-', '').isdigit()
                and t2.lower() not in _SKIP_WORDS):
            meaningful.append(t2.upper())
        if len(meaningful) >= 2: break
    return '-'.join(meaningful) if meaningful else None


def unique_slug(base: str, slug_set: set) -> str:
    slug = base; i = 1
    while slug in slug_set:
        slug = f'{base}-{i}'; i += 1
    slug_set.add(slug)
    return slug


def unique_sku_suffix(base_sku: str, name: str, sku_index: dict, sku_counter: dict) -> str:
    part_code = extract_part_code(base_sku, name)
    sku_counter[base_sku] = sku_counter.get(base_sku, 1) + 1

    def make(n):
        c = f'{base_sku}-{part_code}-v{n}' if part_code else f'{base_sku}-v{n}'
        return c[:100]

    candidate = make(sku_counter[base_sku])
    while candidate.upper() in sku_index:
        sku_counter[base_sku] += 1
        candidate = make(sku_counter[base_sku])
    return candidate


# -- Upsert --------------------------------------------------------------------
def upsert_product(prod_cur, row: dict, brand_id, cat_id,
                   sku_index: dict, name_index: dict, slug_set: set, sku_counter: dict):
    raw_sku = (row['sku'] or '').strip()[:100]
    name    = (row['title'] or '').strip()[:300]
    price   = float(row['price']) if row['price'] else 0

    if not name or price <= 0:
        return None, None, 'skip'

    actual_sku = raw_sku

    if raw_sku:
        sku_up   = raw_sku.upper()
        existing = sku_index.get(sku_up)
        if existing:
            pid           = existing['id']
            existing_name = existing['name'].strip()
            if existing_name.lower() == name.lower():
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
                actual_sku = unique_sku_suffix(raw_sku, name, sku_index, sku_counter)

    name_key    = name.lower()
    name_match  = name_index.get(name_key)
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

    slug = unique_slug(slugify(name), slug_set)
    pid  = str(uuid.uuid4())

    inserted_row = None
    for _slug_attempt in range(5):
        try:
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
            break
        except psycopg2.errors.UniqueViolation:
            # Slug çakışması — yeni suffix ile tekrar dene
            slug_set.discard(slug)
            slug = unique_slug(slugify(name) + '-alt', slug_set)
            pid  = str(uuid.uuid4())

    if inserted_row:
        pid = str(inserted_row[0])
        if actual_sku:
            sku_index[actual_sku.upper()] = {'id': pid, 'name': name}
        name_index[name_key] = {'id': pid, 'sku': actual_sku or ''}
        return pid, actual_sku or None, 'insert'

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
    if prod_id in img_cache: return
    urls = row.get('image_urls') or []
    if not urls: return
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
        SELECT "Id"               AS ciq_id,
               "Title"            AS title,
               "Sku"              AS sku,
               "PriceCurrent"     AS price,
               "ShortDescription" AS short_description,
               "LongDescription"  AS long_description,
               "CategoryPath"     AS category_path,
               "Brand"            AS brand,
               "ImageUrls"        AS image_urls,
               "Barcode"          AS barcode,
               "StockStatus"      AS stock_status,
               "Currency"         AS currency
        FROM "NormalizedProducts"
        WHERE "SourceSiteId" = %s AND "IsDeleted" = false
          AND "Title" IS NOT NULL AND "Sku" IS NOT NULL AND "PriceCurrent" > 0
        ORDER BY "Id"
        LIMIT %s OFFSET %s
    ''', (SITE_ID, batch_size, offset))
    cols = [d[0] for d in ciq_cur.description]
    return [dict(zip(cols, r)) for r in ciq_cur.fetchall()]


# -- Ana migration motoru (thread-safe) ----------------------------------------
def run_migration(target: str, make_ecom_conn, batch_size: int, start_offset: int):
    pfx = f'[{target.upper()}]'

    # --- CatalogIQ baglantilari (thread-local) ---
    ciq_conn = psycopg2.connect(CATALOGIQ_DSN); ciq_conn.autocommit = True
    ciq_cur  = ciq_conn.cursor()
    log_conn = psycopg2.connect(CATALOGIQ_DSN); log_conn.autocommit = True
    log_cur  = log_conn.cursor()

    # --- Tracking tablosunu olustur / dogrula ---
    ensure_tracking_table(log_cur, target)
    migrated_ids = load_migrated_ids(log_cur, target)
    tprint(f'{pfx} Onceden aktarilmis: {len(migrated_ids):,} kayit (atlanacak)')

    # --- Ecom baglantilari ---
    tprint(f'{pfx} Ecom DB baglaniyor...')
    meta_conn = make_ecom_conn(); meta_conn.autocommit = True; meta_cur = meta_conn.cursor()
    prod_conn = make_ecom_conn(); prod_conn.autocommit = True; prod_cur = prod_conn.cursor()
    idx_conn  = make_ecom_conn(); idx_conn.autocommit  = True; idx_cur  = idx_conn.cursor()

    # --- Sayimlar ---
    ciq_cur.execute(
        'SELECT COUNT(*) FROM "NormalizedProducts" WHERE "SourceSiteId"=%s'
        ' AND "IsDeleted"=false AND "Title" IS NOT NULL AND "Sku" IS NOT NULL AND "PriceCurrent">0',
        (SITE_ID,)
    )
    total = ciq_cur.fetchone()[0]

    idx_cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
    ecom_before = idx_cur.fetchone()[0]

    # --- Indexler ---
    sku_index, name_index, slug_set = load_indexes(idx_cur, pfx)

    idx_cur.execute('SELECT DISTINCT "ProductId" FROM "ProductImages" WHERE "IsDeleted"=false')
    img_cache = set(str(r[0]) for r in idx_cur.fetchall())
    idx_cur.close(); idx_conn.close()

    tprint(
        f'\n{pfx} CatalogIQ toplam : {total:,} kayit'
        f'\n{pfx} Ecom mevcut      : {ecom_before:,} urun'
        f'\n{pfx} Atlanan (log)    : {len(migrated_ids):,}'
        f'\n{pfx} Batch: {batch_size} | Baslangic offset: {start_offset:,}'
        f'\n{pfx} ' + '-' * 60
    )

    brand_cache: dict = {}
    cat_cache:   dict = {}
    sku_counter: dict = {}

    inserted = updated_sku = updated_name = skipped = skipped_log = err = 0
    offset      = start_offset
    start       = time.time()
    last_report = start

    while True:
        rows = fetch_batch(ciq_cur, offset, batch_size)
        if not rows: break

        for row in rows:
            ciq_id = row['ciq_id']

            # Zaten aktarilmissa atla
            if ciq_id in migrated_ids:
                skipped_log += 1
                continue

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

                # Migration log'a kaydet
                log_migration(log_cur, target, ciq_id, prod_id, actual_sku, action)
                migrated_ids.add(ciq_id)

                if action == 'insert':
                    inserted += 1
                elif action in ('update_sku', 'update_sku_conflict'):
                    updated_sku += 1
                elif action == 'update_name':
                    updated_name += 1

            except Exception as e:
                err += 1
                logger.error('[%s] CIQ_ID=%s SKU=%s TITLE=%s ERR=%s',
                             target, ciq_id, row.get('sku', '?'), (row.get('title') or '')[:60], e)

        offset += len(rows)
        now = time.time()
        if now - last_report >= 30:
            elapsed   = now - start
            processed = offset - start_offset - skipped_log
            rate      = processed / elapsed if elapsed > 0 else 0
            remaining = (total - offset) / rate if rate > 0 else 0
            tprint(
                f'{pfx} [{time.strftime("%H:%M:%S")}] {offset:>8,}/{total:,} | '
                f'INS={inserted:,} UPD_SKU={updated_sku:,} UPD_NM={updated_name:,} '
                f'SKIP={skipped:,} LOG_SKIP={skipped_log:,} ERR={err:,} | '
                f'{rate:.0f}/sn | ~{remaining/60:.1f}dk'
            )
            last_report = now

    # --- Final sayim ---
    final_conn = make_ecom_conn(); final_conn.autocommit = True
    final_cur  = final_conn.cursor()
    final_cur.execute('SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false')
    ecom_after = final_cur.fetchone()[0]
    final_cur.close(); final_conn.close()

    elapsed = time.time() - start
    tprint(
        f'\n{pfx} ' + '=' * 60 +
        f'\n{pfx} MIGRASYON TAMAMLANDI'
        f'\n{pfx}   Sure              : {elapsed/60:.1f} dakika'
        f'\n{pfx}   Kaynak            : {total:,} CatalogIQ kaydi'
        f'\n{pfx}   Log ile atlanan   : {skipped_log:,}'
        f'\n{pfx}   Eklenen (yeni)    : {inserted:,}'
        f'\n{pfx}   Guncellenen (SKU) : {updated_sku:,}'
        f'\n{pfx}   Guncellenen (Isim): {updated_name:,}'
        f'\n{pfx}   Atlanan (gecersiz): {skipped:,}'
        f'\n{pfx}   Hata              : {err:,}'
        f'\n{pfx}   Ecom oncesi       : {ecom_before:,} urun'
        f'\n{pfx}   Ecom sonrasi      : {ecom_after:,} urun'
        f'\n{pfx}   Net artis         : +{ecom_after - ecom_before:,}'
        f'\n{pfx} ' + '=' * 60
    )

    # Baglantilari kapat
    ciq_cur.close();  ciq_conn.close()
    log_cur.close();  log_conn.close()
    meta_cur.close(); meta_conn.close()
    prod_cur.close(); prod_conn.close()

    if err:
        tprint(f'{pfx} Hata log: {LOG_FILE}')


# -- Main ----------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--target', choices=['local', 'bulutx', 'both'], default='local')
    parser.add_argument('--batch',  type=int, default=2000)
    parser.add_argument('--offset', type=int, default=0)
    args = parser.parse_args()

    # --- Local baglanti fabrikasi ---
    def make_local_conn():
        return psycopg2.connect(LOCAL_PG_DSN, connect_timeout=15)

    # --- BulutX SSH & baglanti fabrikasi ---
    ssh_bulutx = tunnel_bulutx = None
    make_bulutx_conn = None

    if args.target in ('bulutx', 'both'):
        ssh_bulutx, tunnel_bulutx, pg_pass = setup_bulutx_tunnel(LOCAL_TUNNEL)

        def make_bulutx_conn():
            return psycopg2.connect(
                host='127.0.0.1', port=LOCAL_TUNNEL,
                dbname=PG_DB, user=PG_USER, password=pg_pass,
                connect_timeout=15
            )

    try:
        if args.target == 'both':
            t_local  = threading.Thread(
                target=run_migration,
                args=('local',  make_local_conn,  args.batch, args.offset),
                name='local'
            )
            t_bulutx = threading.Thread(
                target=run_migration,
                args=('bulutx', make_bulutx_conn, args.batch, args.offset),
                name='bulutx'
            )
            tprint('Paralel migration baslatiliyor: LOCAL + BULUTX')
            t_local.start()
            t_bulutx.start()
            t_local.join()
            t_bulutx.join()
            tprint('\nTum hedefler tamamlandi.')

        elif args.target == 'local':
            run_migration('local', make_local_conn, args.batch, args.offset)

        else:
            run_migration('bulutx', make_bulutx_conn, args.batch, args.offset)

    finally:
        if tunnel_bulutx: tunnel_bulutx.close()
        if ssh_bulutx:    ssh_bulutx.close()


if __name__ == '__main__':
    main()
