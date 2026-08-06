# -*- coding: utf-8 -*-
"""
autoforcepart-no-image.png'yi sunucudan indirip R2'ye yükler.
R2 key: static/autoforcepart-no-image.png
"""
import os, sys, io
import paramiko

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

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

R2_ACCOUNT_ID    = os.environ['R2_ACCOUNT_ID']
R2_ACCESS_KEY_ID = os.environ['R2_ACCESS_KEY_ID']
R2_SECRET_KEY    = os.environ['R2_SECRET_ACCESS_KEY']
R2_BUCKET        = os.environ['R2_BUCKET']
R2_PUBLIC_URL    = os.environ['R2_PUBLIC_URL'].rstrip('/')

try:
    import boto3
    from botocore.config import Config
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'boto3', '-q'])
    import boto3
    from botocore.config import Config

# 1. Sunucudan indir
print("Sunucuya bağlanılıyor...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

sftp = client.open_sftp()
buf = io.BytesIO()
sftp.getfo('/opt/ecom/backend/src/Ecom.API/Assets/autoforcepart-no-image.png', buf)
sftp.close()
client.close()

file_bytes = buf.getvalue()
print(f"İndirildi: {len(file_bytes):,} bytes")

# 2. R2'ye yükle
s3 = boto3.client(
    's3',
    endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version='s3v4'),
    region_name='auto',
)

key = 'static/autoforcepart-no-image.png'
s3.put_object(
    Bucket=R2_BUCKET,
    Key=key,
    Body=file_bytes,
    ContentType='image/png',
    CacheControl='public, max-age=31536000, immutable',
    ACL='public-read',
)

r2_url = f'{R2_PUBLIC_URL}/{key}'
print(f"R2'ye yüklendi: {r2_url}")
