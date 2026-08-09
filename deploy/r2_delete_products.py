# -*- coding: utf-8 -*-
"""
R2 bucket'ındaki 'products/' prefix altındaki tüm objeleri siler.

DRY_RUN = True  → sadece sayıyı raporlar, silmez
DRY_RUN = False → gerçek silme (geri alınamaz)
"""
import os, sys, time
sys.stdout.reconfigure(encoding='utf-8')

DRY_RUN = False

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_env):
    with open(_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

try:
    import boto3
    from botocore.config import Config
except ImportError:
    print("boto3 yuklu degil. Yuklemek icin: pip install boto3")
    sys.exit(1)

ACCOUNT_ID = os.environ['R2_ACCOUNT_ID']
ACCESS_KEY = os.environ['R2_ACCESS_KEY_ID']
SECRET_KEY = os.environ['R2_SECRET_ACCESS_KEY']
BUCKET     = os.environ['R2_BUCKET']
PREFIX     = 'products/'   # Bu prefix altındaki TÜM objeler silinecek

s3 = boto3.client(
    's3',
    endpoint_url=f'https://{ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    config=Config(signature_version='s3v4'),
    region_name='auto',
)

print(f"Bucket : {BUCKET}")
print(f"Prefix : {PREFIX}")
print(f"DRY_RUN: {DRY_RUN}")
print()

paginator  = s3.get_paginator('list_objects_v2')
total_objs = 0
total_size = 0
batch_num  = 0
t0         = time.time()

for page in paginator.paginate(Bucket=BUCKET, Prefix=PREFIX):
    contents = page.get('Contents', [])
    if not contents:
        continue

    total_objs += len(contents)
    total_size += sum(o['Size'] for o in contents)
    batch_num  += 1

    if batch_num % 10 == 0 or batch_num == 1:
        elapsed = time.time() - t0
        print(f"  Tarandi: {total_objs:,} obje | {total_size/1024**2:.1f} MB ({elapsed:.0f}s)", flush=True)

    if not DRY_RUN:
        keys = [{'Key': o['Key']} for o in contents]
        resp = s3.delete_objects(Bucket=BUCKET, Delete={'Objects': keys, 'Quiet': True})
        errors = resp.get('Errors', [])
        if errors:
            print(f"  HATA (batch {batch_num}): {errors[:3]}")

elapsed = time.time() - t0
print()
print("=" * 50)
print(f"Toplam obje : {total_objs:,}")
print(f"Toplam boyut: {total_size/1024**2:.1f} MB ({total_size/1024**3:.2f} GB)")
print(f"Sure        : {elapsed:.0f}s")
if DRY_RUN:
    print()
    print("DRY_RUN=True → hicbir sey silinmedi.")
    print("Silmek icin DRY_RUN=False yapip tekrar calistir.")
else:
    print(f"\nSilindi: {total_objs:,} obje")
