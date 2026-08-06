# -*- coding: utf-8 -*-
"""
Bu script SUNUCUDA çalışır — doğrudan Docker Postgres'e bağlanır.
deploy/ssh_run_r2_migration.py tarafından /tmp'ye kopyalanıp çalıştırılır.
"""
import os, sys, time, uuid, mimetypes, concurrent.futures, logging, subprocess, json

try:
    import boto3
    import requests
    from botocore.config import Config
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'boto3', 'requests', '-q'])
    import boto3
    import requests
    from botocore.config import Config

sys.stdout.reconfigure(encoding='utf-8')

R2_ACCOUNT_ID = os.environ['R2_ACCOUNT_ID']
R2_ACCESS_KEY = os.environ['R2_ACCESS_KEY_ID']
R2_SECRET_KEY = os.environ['R2_SECRET_ACCESS_KEY']
R2_BUCKET     = os.environ['R2_BUCKET']
R2_PUBLIC_URL = os.environ['R2_PUBLIC_URL'].rstrip('/')

PG_CONTAINER  = os.environ.get('PG_CONTAINER', 'ecom-postgres-1')
PG_USER       = os.environ.get('POSTGRES_USER', 'ecom')
PG_DB         = os.environ.get('POSTGRES_DB', 'EcomDb')

BATCH_SIZE       = 80
DOWNLOAD_TIMEOUT = 20
PROGRESS_FILE    = '/tmp/r2_migration_progress.txt'
ERROR_LOG        = '/tmp/r2_migration_errors.log'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/tmp/r2_migration.log', encoding='utf-8'),
    ]
)
log = logging.getLogger(__name__)

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(
        signature_version='s3v4',
        max_pool_connections=BATCH_SIZE + 10,
    ),
    region_name='auto',
)

def pg_query(sql):
    proc = subprocess.run(
        ['docker', 'exec', '-i', PG_CONTAINER, 'psql', '-U', PG_USER, '-d', PG_DB, '-t', '-F|'],
        input=sql, capture_output=True, text=True, timeout=300
    )
    return proc.stdout + proc.stderr

def load_progress():
    done = set()
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    done.add(line)
    return done

def mark_done(image_id):
    with open(PROGRESS_FILE, 'a', encoding='utf-8') as f:
        f.write(f'{image_id}\n')

def log_error(image_id, url, reason):
    with open(ERROR_LOG, 'a', encoding='utf-8') as f:
        f.write(f'{image_id}\t{url}\t{reason}\n')

def process_image(row):
    image_id, url = row
    url = url.strip()

    if not url or url.startswith(R2_PUBLIC_URL):
        return image_id, None, 'skip'

    try:
        resp = requests.get(url, timeout=DOWNLOAD_TIMEOUT, stream=True,
                            headers={'User-Agent': 'Mozilla/5.0 (compatible; EcomBot/1.0)'})
        if not resp.ok:
            return image_id, url, f'http_{resp.status_code}'

        content_type = resp.headers.get('Content-Type', 'image/jpeg').split(';')[0].strip()
        if not content_type.startswith('image/'):
            return image_id, url, f'bad_content_type:{content_type}'

        ext = mimetypes.guess_extension(content_type) or '.jpg'
        if ext == '.jpe': ext = '.jpg'
        key = f'products/{uuid.uuid4().hex}{ext}'

        s3.upload_fileobj(
            resp.raw, R2_BUCKET, key,
            ExtraArgs={
                'ContentType': content_type,
                'CacheControl': 'public, max-age=31536000, immutable',
                'ACL': 'public-read',
            }
        )
        return image_id, f'{R2_PUBLIC_URL}/{key}', 'ok'

    except requests.exceptions.Timeout:
        return image_id, url, 'timeout'
    except Exception as e:
        return image_id, url, f'error:{str(e)[:120]}'

def update_db_batch(updates):
    if not updates:
        return
    cases = '\n'.join(f"WHEN '{iid}' THEN '{new_url}'" for iid, new_url in updates)
    ids   = ','.join(f"'{iid}'" for iid, _ in updates)
    sql   = f'UPDATE "ProductImages" SET "ImageUrl" = CASE "Id"\n{cases}\nEND\nWHERE "Id" IN ({ids});\n'
    pg_query(sql)

def main():
    log.info('İlerleme dosyası okunuyor...')
    done = load_progress()
    log.info(f'Daha önce tamamlanan: {len(done)} görsel')

    log.info("DB'den görsel URL'leri çekiliyor...")
    result = pg_query('SELECT "Id", "ImageUrl" FROM "ProductImages" WHERE NOT "IsDeleted" ORDER BY "Id";\n')

    rows = []
    for line in result.splitlines():
        line = line.strip()
        if not line or '|' not in line:
            continue
        parts = line.split('|', 1)
        if len(parts) == 2:
            iid, url = parts[0].strip(), parts[1].strip()
            if iid and iid not in done:
                rows.append((iid, url))

    total = len(rows)
    already_r2 = sum(1 for _, url in rows if url.startswith(R2_PUBLIC_URL))
    log.info(f'Toplam: {total + len(done)} | Atlanacak: {len(done)} | İşlenecek: {total} | Zaten R2: {already_r2}')

    if not rows:
        log.info('İşlenecek görsel kalmadı. Tamamlandı.')
        return

    processed = errors = 0
    start = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
        for batch_start in range(0, len(rows), BATCH_SIZE * 4):
            batch   = rows[batch_start:batch_start + BATCH_SIZE * 4]
            futures = {executor.submit(process_image, row): row for row in batch}
            db_updates = []

            for future in concurrent.futures.as_completed(futures):
                image_id, result_url, status = future.result()
                if status == 'ok':
                    db_updates.append((image_id, result_url))
                    mark_done(image_id)
                elif status == 'skip':
                    mark_done(image_id)
                else:
                    log_error(image_id, futures[future][1], status)
                    mark_done(image_id)
                    errors += 1
                processed += 1

            try:
                update_db_batch(db_updates)
            except Exception as e:
                log.error(f'DB güncelleme hatası: {e}')

            elapsed   = time.time() - start
            rate      = processed / elapsed if elapsed > 0 else 0
            remaining = (total - processed) / rate if rate > 0 else 0
            log.info(
                f'İlerleme: {processed}/{total} ({100*processed/total:.1f}%) | '
                f'Hata: {errors} | Hız: {rate:.1f}/s | Kalan: {remaining/60:.1f} dk'
            )

    log.info(f'Migrasyon tamamlandı. Başarılı: {processed-errors} | Hata: {errors}')

if __name__ == '__main__':
    main()
