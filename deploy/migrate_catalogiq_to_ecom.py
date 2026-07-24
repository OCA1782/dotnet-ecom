# -*- coding: utf-8 -*-
"""
CatalogIQ → Ecom ürün migrasyon scripti.
onlineyedekparca.com ürünlerini CatalogIQ PostgreSQL'den okur,
Ecom sunucusunun /api/products/import endpoint'ine gönderir.

Kullanım:
  python deploy/migrate_catalogiq_to_ecom.py
  python deploy/migrate_catalogiq_to_ecom.py --workers 10 --batch 500 --offset 0
"""
import sys, io, argparse, json, time, logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import psycopg2
import requests

# ──────────────────────────────────────────────
# Konfigürasyon
# ──────────────────────────────────────────────
CATALOGIQ_DSN = "host=127.0.0.1 port=5436 dbname=catalogiq user=catalogiq password=catalogiq"
SITE_ID       = "bc87db68-ebd1-4a35-8656-75ba5b422d72"   # onlineyedekparca.com

ECOM_URL      = "http://178.105.230.111:5124/api/products/import"
CATALOGIQ_KEY = "catalogiq-dev-key-2026"
HEADERS       = {"X-CatalogIQ-Key": CATALOGIQ_KEY, "Content-Type": "application/json"}

LOG_FILE      = "deploy/migrate_catalogiq_errors.log"

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
logging.basicConfig(
    filename=LOG_FILE,
    filemode='a',
    format='%(asctime)s %(levelname)s %(message)s',
    encoding='utf-8',
)
logger = logging.getLogger(__name__)


def send_product(row: dict, session: requests.Session) -> tuple[str, bool, str]:
    """Tek bir ürünü Ecom'a gönder. (sku, success, message) döndürür."""
    image_urls = row.get("image_urls") or []
    first_image = image_urls[0] if image_urls else None
    rest_images = image_urls[1:] if len(image_urls) > 1 else None

    payload = {
        "name":             row["title"],
        "sku":              row["sku"],
        "price":            float(row["price"]) if row["price"] else None,
        "shortDescription": row.get("short_description"),
        "description":      row.get("long_description"),
        "categoryName":     row.get("category_path"),
        "brandName":        row.get("brand"),
        "imageUrl":         first_image,
        "imageUrls":        rest_images,
        "currency":         row.get("currency") or "TRY",
        "sourceUrl":        row.get("canonical_url"),
        "barcode":          row.get("barcode"),
        "stockStatus":      row.get("stock_status"),
    }

    try:
        resp = session.post(ECOM_URL, json=payload, headers=HEADERS, timeout=15)
        if resp.status_code in (200, 201, 204):
            return row["sku"], True, ""
        else:
            msg = f"HTTP {resp.status_code}: {resp.text[:200]}"
            logger.warning("SKU=%s %s", row["sku"], msg)
            return row["sku"], False, msg
    except Exception as e:
        msg = str(e)
        logger.error("SKU=%s %s", row["sku"], msg)
        return row["sku"], False, msg


def fetch_batch(cur, offset: int, batch_size: int) -> list[dict]:
    cur.execute(
        '''
        SELECT
            "Title"            AS title,
            "Sku"              AS sku,
            "PriceCurrent"     AS price,
            "ShortDescription" AS short_description,
            "LongDescription"  AS long_description,
            "CategoryPath"     AS category_path,
            "Brand"            AS brand,
            "ImageUrls"        AS image_urls,
            "CanonicalUrl"     AS canonical_url,
            "Barcode"          AS barcode,
            "StockStatus"      AS stock_status,
            "Currency"         AS currency
        FROM "NormalizedProducts"
        WHERE "SourceSiteId" = %s
          AND "IsDeleted"    = false
          AND "Title"        IS NOT NULL
          AND "Sku"          IS NOT NULL
          AND "PriceCurrent" > 0
        ORDER BY "Id"
        LIMIT %s OFFSET %s
        ''',
        (SITE_ID, batch_size, offset),
    )
    cols = [desc[0] for desc in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=8,  help="Paralel istek sayısı")
    parser.add_argument("--batch",   type=int, default=500, help="DB okuma batch boyutu")
    parser.add_argument("--offset",  type=int, default=0,   help="Başlangıç offset'i (resume için)")
    args = parser.parse_args()

    print(f"[{datetime.now():%H:%M:%S}] Bağlanıyor — CatalogIQ PostgreSQL...")
    conn = psycopg2.connect(CATALOGIQ_DSN)
    cur  = conn.cursor()

    # Toplam sayı
    cur.execute(
        '''SELECT COUNT(*) FROM "NormalizedProducts"
           WHERE "SourceSiteId"=%s AND "IsDeleted"=false
             AND "Title" IS NOT NULL AND "Sku" IS NOT NULL AND "PriceCurrent">0''',
        (SITE_ID,),
    )
    total = cur.fetchone()[0]
    print(f"Toplam ürün: {total:,}")
    print(f"Workers: {args.workers} | Batch: {args.batch} | Offset: {args.offset}")
    print(f"Ecom URL: {ECOM_URL}")
    print("─" * 60)

    ok_count  = 0
    err_count = 0
    offset    = args.offset
    start     = time.time()

    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(max_retries=2, pool_connections=args.workers, pool_maxsize=args.workers)
    session.mount("http://", adapter)

    while True:
        rows = fetch_batch(cur, offset, args.batch)
        if not rows:
            break

        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(send_product, row, session): row["sku"] for row in rows}
            for fut in as_completed(futures):
                sku, success, msg = fut.result()
                if success:
                    ok_count += 1
                else:
                    err_count += 1

        offset   += len(rows)
        elapsed   = time.time() - start
        rate      = ok_count / elapsed if elapsed > 0 else 0
        remaining = (total - offset) / rate if rate > 0 else 0

        print(
            f"[{datetime.now():%H:%M:%S}] "
            f"{offset:>6,}/{total:,} | "
            f"✓{ok_count:,} ✗{err_count:,} | "
            f"{rate:.1f} ürün/sn | "
            f"kalan ~{remaining/60:.1f} dk"
        )

    cur.close()
    conn.close()
    session.close()

    elapsed = time.time() - start
    print("─" * 60)
    print(f"Tamamlandı: {ok_count:,} başarılı, {err_count:,} hata, {elapsed/60:.1f} dakika")
    if err_count > 0:
        print(f"Hata detayları: {LOG_FILE}")


if __name__ == "__main__":
    main()
