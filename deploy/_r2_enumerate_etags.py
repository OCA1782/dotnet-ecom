# -*- coding: utf-8 -*-
"""
R2 bucket'taki tüm products/ objeleri listeler ve ETag dağılımını analiz eder.
OYP placeholder imajlarını ETag eşleşmesiyle tespit eder.
"""
import os, sys, json
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

import boto3
from botocore.config import Config

R2_ACCESS_KEY = 'ea462293c1bcec96309de955f22bded9'
R2_SECRET_KEY = 'a8ebf024f96f636b90f4b6e11b141bfacd5a9c768ef0f7b2c4774e43e69f326a'
R2_ACCOUNT_ID = 'a0ecae78027543f04d4941bcc17ff127'
R2_BUCKET = 'autoforcepart-bucket'
R2_ENDPOINT = f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com'

# Suspect ETag from 500-sample
SUSPECT_ETAG = 'ba0033537283d7888084e8a36861ddb4'
NO_IMAGE_URL = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'
R2_PUBLIC_URL = 'https://images.autoforcepart.com'

s3 = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(region_name='auto')
)

print("=== R2 Bucket Enumeration ===")
print(f"Bucket: {R2_BUCKET}")
print(f"Finding ETag: {SUSPECT_ETAG}")

etag_counts = defaultdict(int)
etag_keys = defaultdict(list)   # etag -> list of keys (max 10 per etag for display)
total_scanned = 0
suspect_keys = []

paginator = s3.get_paginator('list_objects_v2')
pages = paginator.paginate(Bucket=R2_BUCKET, Prefix='products/')

for page in pages:
    objs = page.get('Contents', [])
    for obj in objs:
        etag = obj.get('ETag', '').strip('"')
        key = obj.get('Key', '')
        size = obj.get('Size', 0)
        total_scanned += 1
        etag_counts[etag] += 1
        if len(etag_keys[etag]) < 5:
            etag_keys[etag].append((key, size))
        if etag == SUSPECT_ETAG:
            suspect_keys.append(key)

    if total_scanned % 10000 == 0:
        print(f"  Scanned: {total_scanned}, Suspect found: {len(suspect_keys)}")
        sys.stdout.flush()

print(f"\nToplam taranan: {total_scanned}")
print(f"Farkli ETag sayisi: {len(etag_counts)}")
print(f"\n=== En Sik Tekrar Eden ETagger (OYP adayi) ===")
top_etags = sorted(etag_counts.items(), key=lambda x: -x[1])[:20]
for etag, cnt in top_etags:
    sample = etag_keys[etag][:2]
    print(f"  {etag} x{cnt}")
    for key, sz in sample:
        print(f"    {key} ({sz} bytes)")

print(f"\n=== Supe ETag ({SUSPECT_ETAG}) ===")
print(f"Bulunan: {len(suspect_keys)}")
for k in suspect_keys[:5]:
    print(f"  https://images.autoforcepart.com/{k}")

# Save suspect keys to file
output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_oyp_suspect_keys.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        'suspect_etag': SUSPECT_ETAG,
        'suspect_keys': suspect_keys,
        'total_scanned': total_scanned,
        'top_etags': [(e, c) for e, c in top_etags[:20]]
    }, f, ensure_ascii=False, indent=2)
print(f"\nSonuclar kaydedildi: {output_file}")
