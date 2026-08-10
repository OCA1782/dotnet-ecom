# -*- coding: utf-8 -*-
"""
ImageMigrationLog'da OldImageUrl = OYP no-image olan ve R2'ye yuklenenleri R2'den siler,
ProductImages.ImageUrl'yi eski haline (OYP no-image URL) geri alir,
Log kaydini 'skipped_noimage' olarak gunceller.
"""
import os, sys, io, paramiko, boto3
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

SSH_HOST = os.environ['DEPLOY_SSH_HOST']
SSH_USER = os.environ['DEPLOY_SSH_USER']
SSH_PASS = os.environ['DEPLOY_SSH_PASSWORD']

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
ssh.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=15)

def run_sql(sql, timeout=120):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/tmp/_noimage.sql')
    sftp.close()
    _, out, err = ssh.exec_command(
        'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/_noimage.sql',
        timeout=timeout
    )
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

NOIMAGE_URL = 'https://www.onlineyedekparca.com/img/product-no-image.png'

# 1. Kac tane var?
print('=== [1] R2ye yuklenmis no-image kayitlari ===')
sql_count = f"""
SELECT COUNT(*), COUNT("R2ImageUrl")
FROM "ImageMigrationLog"
WHERE "OldImageUrl" = '{NOIMAGE_URL}'
  AND "Status" = 'success'
  AND "R2ImageUrl" IS NOT NULL;
"""
print(run_sql(sql_count))

# 2. R2 URL listesini cek
print('\n=== [2] R2 URL listesi aliniyor ===')
sql_list = f"""
SELECT "ProductImageId"::text, "R2ImageUrl"
FROM "ImageMigrationLog"
WHERE "OldImageUrl" = '{NOIMAGE_URL}'
  AND "Status" = 'success'
  AND "R2ImageUrl" IS NOT NULL;
"""
result = run_sql(sql_list)

rows = []
for line in result.splitlines():
    line = line.strip()
    if '|' in line and 'ProductImageId' not in line and '---' not in line and line:
        parts = [p.strip() for p in line.split('|')]
        if len(parts) == 2 and parts[0] and parts[1]:
            rows.append((parts[0], parts[1]))

print(f'  Bulunan kayit: {len(rows)}')
if not rows:
    print('  Silinecek kayit yok.')
    ssh.close()
    sys.exit(0)

# 3. R2'den sil (batch — max 1000/istek)
print('\n=== [3] R2den siliniyor (batch) ===')
deleted = 0
errors  = 0
keys = [{'Key': r2_url.replace('https://images.autoforcepart.com/', '')} for _, r2_url in rows]

# 1000'lik gruplara bol
for i in range(0, len(keys), 1000):
    batch = keys[i:i+1000]
    try:
        resp = s3.delete_objects(Bucket=bucket, Delete={'Objects': batch, 'Quiet': True})
        errs = resp.get('Errors', [])
        deleted += len(batch) - len(errs)
        errors  += len(errs)
        for e in errs:
            print(f'  R2 HATA: {e["Key"]} — {e["Message"]}')
        print(f'  Batch {i//1000 + 1}: {len(batch) - len(errs)} silindi')
    except Exception as e:
        print(f'  Batch HATA: {e}')
        errors += len(batch)

print(f'  Toplam: silindi={deleted} | hata={errors}')

# 4. DB: ProductImages.ImageUrl -> eski URL'ye geri al, Log -> skipped_noimage
print('\n=== [4] DB guncelleniyor ===')
sql_update = f"""
-- ProductImages: ImageUrl'yi eski no-image URL'ye geri al
UPDATE "ProductImages" pi
SET "ImageUrl" = '{NOIMAGE_URL}'
FROM "ImageMigrationLog" l
WHERE l."ProductImageId" = pi."Id"
  AND l."OldImageUrl" = '{NOIMAGE_URL}'
  AND l."Status" = 'success';

-- Log: skipped_noimage olarak isaretle
UPDATE "ImageMigrationLog"
SET "Status"       = 'skipped_noimage',
    "R2ImageUrl"   = NULL,
    "ErrorMessage" = 'OYP no-image placeholder — R2 deleted retroactively',
    "MigratedAt"   = NOW()
WHERE "OldImageUrl" = '{NOIMAGE_URL}'
  AND "Status" = 'success';
"""
print(run_sql(sql_update))

# 5. Dogrulama
print('\n=== [5] Dogrulama ===')
sql_verify = f"""
SELECT "Status", COUNT(*)
FROM "ImageMigrationLog"
WHERE "OldImageUrl" = '{NOIMAGE_URL}'
GROUP BY "Status";
"""
print(run_sql(sql_verify))

ssh.close()
print('\nTamamlandi.')
