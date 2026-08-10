# -*- coding: utf-8 -*-
"""
R2 ve DB mevcut migration durumunu tam olarak raporlar.
Karar vermek icin calistir, sonra strateji belirle.
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

SSH_HOST = os.environ['DEPLOY_SSH_HOST']
SSH_USER = os.environ['DEPLOY_SSH_USER']
SSH_PASS = os.environ['DEPLOY_SSH_PASSWORD']

# R2
s3 = boto3.client('s3',
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
    config=Config(signature_version='s3v4'),
    region_name='auto',
)
bucket = os.environ['R2_BUCKET']

print('=== [1] R2 products/ nesne sayisi (hizli sample) ===')
resp = s3.list_objects_v2(Bucket=bucket, Prefix='products/', MaxKeys=5)
sample_count = resp.get('KeyCount', 0)
is_truncated = resp.get('IsTruncated', False)
if sample_count == 0:
    print('  R2 products/: BOŞ (0 nesne)')
elif is_truncated:
    print(f'  R2 products/: 5+ nesne mevcut (truncated) — kesin sayim icin bekle')
    print(f'  Ornek: {[o["Key"] for o in resp.get("Contents", [])[:3]]}')
else:
    print(f'  R2 products/: {sample_count} nesne')

print()

# SSH
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SSH_HOST, username=SSH_USER, password=SSH_PASS, timeout=15)

def run(cmd, timeout=90):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

def run_sql(sql, timeout=120):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/tmp/_audit.sql')
    sftp.close()
    return run('docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/_audit.sql', timeout=timeout)

print('=== [2] DB ProductImages URL dagilimi ===')
sql = r"""
SELECT
  CASE
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%' THEN 'R2-products (DB guncellendi)'
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/static/%'   THEN 'Static CDN'
    WHEN "ImageUrl" LIKE '%onlineyedekparca%'                           THEN 'OYP (kaynak)'
    WHEN "ImageUrl" IS NULL OR "ImageUrl" = ''                          THEN 'NULL / Bos'
    WHEN "ImageUrl" LIKE 'http%'                                        THEN 'Diger external'
    ELSE 'Diger'
  END AS tip,
  COUNT(*) AS adet
FROM "ProductImages"
WHERE "IsDeleted" = false
GROUP BY 1
ORDER BY adet DESC;
"""
print(run_sql(sql))

print()
print('=== [3] Caliskan migration process var mi? ===')
print(run('pgrep -a python3 || echo "Hic python3 processi yok"'))

print()
print('=== [4] Server /tmp migration dosyalari ===')
print(run('ls -lh /tmp/*.py /tmp/*.log /tmp/*.txt 2>/dev/null | grep -v localids'))

print()
print('=== [5] ImageMigrationLog tablosu var mi? ===')
sql2 = r"""
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'ImageMigrationLog'
);
"""
print(run_sql(sql2, timeout=30))

ssh.close()

print()
print('=== OZET ===')
if sample_count == 0 and not is_truncated:
    print('  R2: BOŞ')
elif is_truncated:
    print('  R2: DOLU (5+ nesne) — tam sayim gerekiyor')
else:
    print(f'  R2: {sample_count} nesne')
