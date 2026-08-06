# -*- coding: utf-8 -*-
"""
Ürün görsellerini üçüncü taraf URL'lerden Cloudflare R2'ye taşır.
DB'deki ImageUrl alanlarını yeni R2 URL'leriyle günceller.

Kullanım:
  export R2_ACCOUNT_ID=...
  export R2_ACCESS_KEY_ID=...
  export R2_SECRET_ACCESS_KEY=...
  export R2_BUCKET=ecom-images
  export R2_PUBLIC_URL=https://images.autoforcepart.com
  export DEPLOY_SSH_HOST=...
  export DEPLOY_SSH_USER=...
  export DEPLOY_SSH_PASSWORD=...
  python deploy/migrate_images_to_r2.py

Özellikler:
  - Batch işlem (BATCH_SIZE=100 paralel)
  - İlerleme dosyası: /tmp/r2_migration_progress.txt — yarıda kesilirse kaldığı yerden devam eder
  - Zaten R2'de olan URL'leri atlar
  - Başarısız URL'leri r2_migration_errors.log dosyasına yazar
"""

import os, sys, time, uuid, mimetypes, concurrent.futures, logging
import paramiko
import boto3
import requests
from botocore.config import Config

sys.stdout.reconfigure(encoding='utf-8')

# Yerel .env dosyasını oku
_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if '=' in _line and not _line.startswith('#'):
                _k, _, _v = _line.partition('=')
                if _k.strip() not in os.environ:
                    os.environ[_k.strip()] = _v.strip()

# ── Yapılandırma ──────────────────────────────────────────────────────────────
R2_ACCOUNT_ID  = os.environ['R2_ACCOUNT_ID']
R2_ACCESS_KEY  = os.environ['R2_ACCESS_KEY_ID']
R2_SECRET_KEY  = os.environ['R2_SECRET_ACCESS_KEY']
R2_BUCKET      = os.environ['R2_BUCKET']
R2_PUBLIC_URL  = os.environ['R2_PUBLIC_URL'].rstrip('/')

SSH_HOST       = os.environ['DEPLOY_SSH_HOST']
SSH_USER       = os.environ['DEPLOY_SSH_USER']
SSH_PASSWORD   = os.environ['DEPLOY_SSH_PASSWORD']

BATCH_SIZE     = 50    # paralel thread sayısı
DOWNLOAD_TIMEOUT = 20  # saniye
PROGRESS_FILE  = 'r2_migration_progress.txt'
ERROR_LOG      = 'r2_migration_errors.log'
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

# R2 (S3-uyumlu) istemcisi
s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version='s3v4'),
    region_name='auto',
)

# SSH bağlantısı
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SSH_HOST, username=SSH_USER, password=SSH_PASSWORD, timeout=15)

def run_ssh(cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

def pg_file(sql, timeout=120):
    sftp = ssh.open_sftp()
    with sftp.open('/tmp/mig.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    return run_ssh('docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t -F"|" < /tmp/mig.sql', timeout=timeout)

# ── İlerleme dosyası ──────────────────────────────────────────────────────────
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

# ── Tek görsel işleme ─────────────────────────────────────────────────────────
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
            resp.raw,
            R2_BUCKET,
            key,
            ExtraArgs={
                'ContentType': content_type,
                'CacheControl': 'public, max-age=31536000, immutable',
                'ACL': 'public-read',
            }
        )

        new_url = f'{R2_PUBLIC_URL}/{key}'
        return image_id, new_url, 'ok'

    except requests.exceptions.Timeout:
        return image_id, url, 'timeout'
    except Exception as e:
        return image_id, url, f'error:{str(e)[:120]}'

# ── DB güncelle ───────────────────────────────────────────────────────────────
def update_db_batch(updates):
    if not updates:
        return
    cases = '\n'.join(
        f'WHEN \'{iid}\' THEN \'{new_url}\''
        for iid, new_url in updates
    )
    ids = ','.join(f'\'{iid}\'' for iid, _ in updates)
    sql = f'''
UPDATE "ProductImages"
SET "ImageUrl" = CASE "Id"
{cases}
END
WHERE "Id" IN ({ids});
'''
    pg_file(sql, timeout=60)

# ── Ana akış ─────────────────────────────────────────────────────────────────
def main():
    log.info('İlerleme dosyası okunuyor...')
    done = load_progress()
    log.info(f'Daha önce tamamlanan: {len(done)} görsel')

    log.info('DB\'den görsel URL\'leri çekiliyor...')
    result = pg_file('''
SELECT "Id", "ImageUrl" FROM "ProductImages"
WHERE NOT "IsDeleted"
ORDER BY "Id";
''', timeout=300)

    rows = []
    for line in result.splitlines():
        line = line.strip()
        if not line or '|' not in line:
            continue
        parts = line.split('|', 1)
        if len(parts) == 2:
            image_id, url = parts[0].strip(), parts[1].strip()
            if image_id and image_id not in done:
                rows.append((image_id, url))

    total = len(rows)
    already_r2 = sum(1 for _, url in rows if url.startswith(R2_PUBLIC_URL))
    log.info(f'Toplam: {total + len(done)} | Atlanacak (done): {len(done)} | İşlenecek: {total} | Zaten R2: {already_r2}')

    if not rows:
        log.info('İşlenecek görsel kalmadı. Tamamlandı.')
        return

    processed = 0
    errors    = 0
    start     = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
        for batch_start in range(0, len(rows), BATCH_SIZE * 4):
            batch = rows[batch_start:batch_start + BATCH_SIZE * 4]
            futures = {executor.submit(process_image, row): row for row in batch}
            db_updates = []

            for future in concurrent.futures.as_completed(futures):
                image_id, result_url, status = future.result()

                if status == 'ok':
                    db_updates.append((image_id, result_url))
                    mark_done(image_id)
                    processed += 1
                elif status == 'skip':
                    mark_done(image_id)
                    processed += 1
                else:
                    log_error(image_id, futures[future][1], status)
                    mark_done(image_id)  # hatalıları da done say — sonsuz döngüyü önle
                    errors += 1
                    processed += 1

            # Batch'i DB'ye yaz
            try:
                update_db_batch(db_updates)
            except Exception as e:
                log.error(f'DB güncelleme hatası: {e}')

            elapsed  = time.time() - start
            rate     = processed / elapsed if elapsed > 0 else 0
            remaining = (total - processed) / rate if rate > 0 else 0
            log.info(
                f'İlerleme: {processed}/{total} '
                f'({100*processed/total:.1f}%) | '
                f'Hata: {errors} | '
                f'Hız: {rate:.1f}/s | '
                f'Kalan: {remaining/60:.1f} dk'
            )

    log.info(f'Migrasyon tamamlandı. Başarılı: {processed-errors} | Hata: {errors}')
    ssh.close()

if __name__ == '__main__':
    main()
