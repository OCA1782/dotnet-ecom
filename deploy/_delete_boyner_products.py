# -*- coding: utf-8 -*-
"""
Boyner kaynaklı ürünleri sunucu DB'den ve R2'den siler.
- ImageMigrationLog üzerinden ProductId'leri bulur
- ProductImages'taki R2 URL'lerini toplar
- DB'den siler (CartItems, WishlistItems, ProductReviews, Stocks, ProductImages, ProductVariants, Products, ImageMigrationLog)
- R2 nesnelerini siler
"""
import os, sys, json
import paramiko
import boto3
from botocore.config import Config

sys.stdout.reconfigure(encoding='utf-8')

# Load .env
_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

host         = os.environ['DEPLOY_SSH_HOST']
ssh_user     = os.environ['DEPLOY_SSH_USER']
ssh_password = os.environ['DEPLOY_SSH_PASSWORD']
r2_account   = os.environ['R2_ACCOUNT_ID']
r2_key_id    = os.environ['R2_ACCESS_KEY_ID']
r2_secret    = os.environ['R2_SECRET_ACCESS_KEY']
r2_bucket    = os.environ['R2_BUCKET']
r2_pub_url   = os.environ.get('R2_PUBLIC_URL', 'https://images.autoforcepart.com')

print("=== Boyner Ürün Silme ===")

# SSH bağlantısı
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=ssh_user, password=ssh_password, timeout=15)
print(f"SSH bağlandı: {host}")

def ssh_run(cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()
    return out

def get_pg_creds():
    out = ssh_run("grep -E '^POSTGRES_USER=|^POSTGRES_PASSWORD=' /opt/ecom/.env")
    env = {}
    for line in out.splitlines():
        k, _, v = line.partition('=')
        env[k.strip()] = v.strip()
    return env.get('POSTGRES_USER', 'ecom'), env.get('POSTGRES_PASSWORD', '')

pg_user, pg_pass = get_pg_creds()
print(f"PostgreSQL user: {pg_user}")

def psql(sql, timeout=120):
    sql_escaped = sql.replace("'", "'\\''")
    cmd = f"docker exec -i ecom-postgres-1 psql -U {pg_user} -d EcomDb -c '{sql_escaped}'"
    return ssh_run(cmd, timeout=timeout)

def psql_file(sql, timeout=120):
    sftp = client.open_sftp()
    with sftp.file('/tmp/_boyner_sql.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    cmd = "docker exec -i ecom-postgres-1 psql -U " + pg_user + " -d EcomDb < /tmp/_boyner_sql.sql"
    return ssh_run(cmd, timeout=timeout)

# 1. ImageMigrationLog'dan ProductId sayısını al
print("\n--- ImageMigrationLog üzerinden Boyner ProductId sayısı ---")
count_result = psql('SELECT COUNT(DISTINCT "ProductId") FROM "ImageMigrationLog" WHERE "OldImageUrl" ILIKE \'%boyner%\';')
print(count_result)

# 2. R2 image URL'lerini topla (ProductImages'tan — silmeden önce)
print("\n--- R2 image URL'leri toplanıyor ---")
get_urls_sql = """
COPY (
  SELECT DISTINCT pi."ImageUrl"
  FROM "ProductImages" pi
  JOIN "ImageMigrationLog" ml ON ml."ProductId" = pi."ProductId"
  WHERE ml."OldImageUrl" ILIKE '%boyner%'
    AND pi."ImageUrl" ILIKE '%autoforcepart%'
) TO '/tmp/_boyner_r2_urls.txt';
"""
result = psql_file(get_urls_sql)
print(result)

# R2 URL dosyasını al
r2_urls = []
try:
    sftp = client.open_sftp()
    with sftp.file('/tmp/_boyner_r2_urls.txt', 'r') as f:
        content = f.read().decode('utf-8', errors='replace')
    sftp.close()
    r2_urls = [line.strip() for line in content.splitlines() if line.strip()]
    print(f"R2 URL sayısı: {len(r2_urls)}")
    if r2_urls:
        print(f"Örnek: {r2_urls[0]}")
except Exception as e:
    print(f"R2 URL dosyası okunamadı: {e}")

# Ayrıca ImageMigrationLog'daki R2ImageUrl'leri de topla
print("\n--- ImageMigrationLog R2ImageUrl'leri toplanıyor ---")
get_log_urls_sql = """
COPY (
  SELECT DISTINCT "R2ImageUrl"
  FROM "ImageMigrationLog"
  WHERE "OldImageUrl" ILIKE '%boyner%'
    AND "R2ImageUrl" IS NOT NULL
    AND "R2ImageUrl" != ''
) TO '/tmp/_boyner_log_r2_urls.txt';
"""
result = psql_file(get_log_urls_sql)
print(result)

log_r2_urls = []
try:
    sftp = client.open_sftp()
    with sftp.file('/tmp/_boyner_log_r2_urls.txt', 'r') as f:
        content = f.read().decode('utf-8', errors='replace')
    sftp.close()
    log_r2_urls = [line.strip() for line in content.splitlines() if line.strip()]
    print(f"Log R2 URL sayısı: {len(log_r2_urls)}")
except Exception as e:
    print(f"Log R2 URL dosyası okunamadı: {e}")

# Tüm benzersiz R2 URL'leri birleştir
all_r2_urls = list(set(r2_urls + log_r2_urls))
print(f"\nToplam benzersiz R2 URL: {len(all_r2_urls)}")

# 3. DB'den sil
print("\n--- DB'den silme başlıyor ---")
delete_sql = """
BEGIN;

CREATE TEMP TABLE _boyner_ids AS
SELECT DISTINCT "ProductId" FROM "ImageMigrationLog"
WHERE "OldImageUrl" ILIKE '%boyner%';

SELECT COUNT(*) AS silinecek_urun_sayisi FROM _boyner_ids;

DELETE FROM "CartItems" WHERE "ProductId" IN (SELECT "ProductId" FROM _boyner_ids);
DELETE FROM "WishlistItems" WHERE "ProductId" IN (SELECT "ProductId" FROM _boyner_ids);
DELETE FROM "ProductReviews" WHERE "ProductId" IN (SELECT "ProductId" FROM _boyner_ids);
DELETE FROM "Stocks" WHERE "ProductId" IN (SELECT "ProductId" FROM _boyner_ids);
DELETE FROM "ProductImages" WHERE "ProductId" IN (SELECT "ProductId" FROM _boyner_ids);
DELETE FROM "ProductVariants" WHERE "ProductId" IN (SELECT "ProductId" FROM _boyner_ids);
DELETE FROM "Products" WHERE "Id" IN (SELECT "ProductId" FROM _boyner_ids);
DELETE FROM "ImageMigrationLog" WHERE "ProductId" IN (SELECT "ProductId" FROM _boyner_ids);

COMMIT;
"""
result = psql_file(delete_sql, timeout=300)
print(result)

client.close()

# 4. R2'den sil
if not all_r2_urls:
    print("\nR2'de silinecek URL bulunamadı, atlanıyor.")
else:
    print(f"\n--- R2'den {len(all_r2_urls)} nesne siliniyor ---")
    r2_client = boto3.client(
        's3',
        endpoint_url=f'https://{r2_account}.r2.cloudflarestorage.com',
        aws_access_key_id=r2_key_id,
        aws_secret_access_key=r2_secret,
        config=Config(signature_version='s3v4'),
        region_name='auto',
    )

    # URL'den bucket key'i çıkar
    def url_to_key(url):
        if r2_pub_url in url:
            key = url.replace(r2_pub_url, '').lstrip('/')
        else:
            # fallback: URL path'ten al
            from urllib.parse import urlparse
            key = urlparse(url).path.lstrip('/')
        return key

    keys = [url_to_key(u) for u in all_r2_urls if u]
    keys = [k for k in keys if k]
    print(f"Silinecek key sayısı: {len(keys)}")
    if keys:
        print(f"Örnek key: {keys[0]}")

    # Batch delete (max 1000 per request)
    total_deleted = 0
    errors = []
    for i in range(0, len(keys), 1000):
        batch = keys[i:i+1000]
        objects = [{'Key': k} for k in batch]
        try:
            resp = r2_client.delete_objects(
                Bucket=r2_bucket,
                Delete={'Objects': objects, 'Quiet': True}
            )
            deleted = len(batch) - len(resp.get('Errors', []))
            total_deleted += deleted
            batch_errors = resp.get('Errors', [])
            if batch_errors:
                errors.extend(batch_errors)
                print(f"  Batch {i//1000+1}: {deleted}/{len(batch)} silindi, {len(batch_errors)} hata")
            else:
                print(f"  Batch {i//1000+1}: {deleted}/{len(batch)} silindi")
        except Exception as e:
            print(f"  Batch {i//1000+1} hatası: {e}")
            errors.append(str(e))

    print(f"\nR2 toplam silinen: {total_deleted}")
    if errors:
        print(f"Hatalar ({len(errors)}): {errors[:5]}")

print("\n=== Tamamlandı ===")
