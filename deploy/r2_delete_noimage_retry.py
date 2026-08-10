# -*- coding: utf-8 -*-
"""
skipped_noimage kayitlarinin R2 key'lerini ProductImageId'den reconstruct edip siler.
R2'de olmayan key'ler icin hata donmez (idempotent).
"""
import os, sys, io, time, paramiko, boto3
from botocore.config import Config

sys.stdout.reconfigure(encoding='utf-8')

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(_env, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip()

s3 = boto3.client('s3',
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
    config=Config(signature_version='s3v4'),
    region_name='auto',
)
bucket = os.environ['R2_BUCKET']

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.environ['DEPLOY_SSH_HOST'], username=os.environ['DEPLOY_SSH_USER'],
            password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run_sql(sql, timeout=120):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/tmp/_retry.sql')
    sftp.close()
    _, out, err = ssh.exec_command(
        'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/_retry.sql',
        timeout=timeout
    )
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

NOIMAGE_URL = 'https://www.onlineyedekparca.com/img/product-no-image.png'

print('=== skipped_noimage ProductImageId listesi aliniyor ===')
sql = f"""
SELECT "ProductImageId"::text
FROM "ImageMigrationLog"
WHERE "OldImageUrl" = '{NOIMAGE_URL}'
  AND "Status" = 'skipped_noimage';
"""
result = run_sql(sql, timeout=60)
ssh.close()

img_ids = []
for line in result.splitlines():
    line = line.strip()
    if line and '-' in line and len(line) == 36:
        img_ids.append(line)

print(f'  Toplam kayit: {len(img_ids)}')

# R2 key'leri reconstruct et: products/{uuid_no_hyphens}.jpg
# Not: extension .jpg varsayildi (migrate sirasinda get_ext kullanildi ama
#      no-image PNG oldugu icin .png olmali — her iki uzantıyı dene)
extensions = ['.png', '.jpg', '.jpeg', '.webp']
keys = []
for img_id in img_ids:
    base = 'products/' + img_id.replace('-', '')
    for ext in extensions:
        keys.append({'Key': base + ext})

print(f'  Silinecek aday key sayisi: {len(keys)} ({len(img_ids)} gorsel x {len(extensions)} uzanti)')

print('\n=== R2den siliniyor (batch, rate-limit korumali) ===')
deleted = 0
errors  = 0
batch_size = 500  # Rate limit icin 1000 yerine 500

for i in range(0, len(keys), batch_size):
    batch = keys[i:i+batch_size]
    retry = 3
    while retry > 0:
        try:
            resp = s3.delete_objects(Bucket=bucket, Delete={'Objects': batch, 'Quiet': True})
            errs = resp.get('Errors', [])
            deleted += len(batch) - len(errs)
            errors  += len(errs)
            for e in errs:
                if e.get('Code') != 'NoSuchKey':
                    print(f'  HATA: {e["Key"]} — {e["Message"]}')
            print(f'  Batch {i//batch_size + 1}: {len(batch) - len(errs)} silindi')
            break
        except Exception as e:
            retry -= 1
            print(f'  Batch hatasi ({3-retry}/3): {e}')
            if retry > 0:
                time.sleep(5)
            else:
                errors += len(batch)

print(f'\nToplam: silindi={deleted} | hata={errors}')
print('Tamamlandi.')
