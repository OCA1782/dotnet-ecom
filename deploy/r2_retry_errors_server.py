# -*- coding: utf-8 -*-
"""
Bu script SUNUCUDA çalışır.
r2_migration_errors.log'daki başarısız görselleri yeniden dener.
- bad_content_type:application/octet-stream → URL uzantısından content-type tahmin eder
- timeout → tekrar dener
deploy/ssh_run_r2_retry.py tarafından /tmp'ye kopyalanıp çalıştırılır.
"""
import os, sys, time, uuid, mimetypes, concurrent.futures, logging, subprocess
from urllib.parse import urlparse

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
DOWNLOAD_TIMEOUT = 25
ERROR_LOG_IN     = '/tmp/r2_migration_errors.log'   # orijinal hata logu (input)
PROGRESS_FILE    = '/tmp/r2_retry_progress.txt'
ERROR_LOG_OUT    = '/tmp/r2_retry_errors.log'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/tmp/r2_retry.log', encoding='utf-8'),
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
    with open(ERROR_LOG_OUT, 'a', encoding='utf-8') as f:
        f.write(f'{image_id}\t{url}\t{reason}\n')

def guess_content_type(url: str) -> str:
    """URL uzantısından content-type tahmin eder."""
    path = urlparse(url).path.lower().split('?')[0]
    if path.endswith(('.jpg', '.jpeg')):
        return 'image/jpeg'
    if path.endswith('.png'):
        return 'image/png'
    if path.endswith('.webp'):
        return 'image/webp'
    if path.endswith('.gif'):
        return 'image/gif'
    if path.endswith('.bmp'):
        return 'image/bmp'
    return 'image/jpeg'  # varsayılan

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

        content_type = resp.headers.get('Content-Type', '').split(';')[0].strip()

        # bad_content_type veya boş content-type → URL uzantısından tahmin et
        if not content_type.startswith('image/'):
            content_type = guess_content_type(url)

        ext = mimetypes.guess_extension(content_type) or '.jpg'
        if ext == '.jpe':
            ext = '.jpg'
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
    if not os.path.exists(ERROR_LOG_IN):
        log.error(f'Hata logu bulunamadı: {ERROR_LOG_IN}')
        return

    log.info('İlerleme dosyası okunuyor...')
    done = load_progress()
    log.info(f'Daha önce tamamlanan (retry): {len(done)} görsel')

    log.info(f'Hata logu okunuyor: {ERROR_LOG_IN}')
    rows = []
    skipped_reasons = set()
    with open(ERROR_LOG_IN, encoding='utf-8', errors='replace') as f:
        for line in f:
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 3:
                continue
            image_id, url, reason = parts[0], parts[1], '\t'.join(parts[2:])
            # Sadece octet-stream ve timeout hataları yeniden dene
            if image_id in done:
                continue
            if reason.startswith('bad_content_type:application/octet-stream') or reason == 'timeout':
                rows.append((image_id, url))
            else:
                skipped_reasons.add(reason[:50])

    log.info(f'Yeniden denenecek: {len(rows)} | Atlanıyor (başka hata): {len(skipped_reasons)} farklı neden')
    log.info(f'Atlanan hata nedenleri: {skipped_reasons}')

    if not rows:
        log.info('Yeniden denenecek görsel yok. Tamamlandı.')
        return

    total = len(rows)
    processed = success = errors = 0
    start = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
        for batch_start in range(0, total, BATCH_SIZE * 4):
            batch   = rows[batch_start:batch_start + BATCH_SIZE * 4]
            futures = {executor.submit(process_image, row): row for row in batch}
            db_updates = []

            for future in concurrent.futures.as_completed(futures):
                image_id, result_url, status = future.result()
                if status == 'ok':
                    db_updates.append((image_id, result_url))
                    mark_done(image_id)
                    success += 1
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

            elapsed = time.time() - start
            speed   = processed / elapsed if elapsed > 0 else 0
            remaining = (total - processed) / speed / 60 if speed > 0 else 0
            log.info(f'İlerleme: {processed}/{total} ({processed/total*100:.1f}%) | '
                     f'Başarılı: {success} | Hata: {errors} | '
                     f'Hız: {speed:.1f}/s | Kalan: {remaining:.1f} dk')

    log.info(f'Retry tamamlandı. Başarılı: {success} | Hata: {errors}')

if __name__ == '__main__':
    main()
