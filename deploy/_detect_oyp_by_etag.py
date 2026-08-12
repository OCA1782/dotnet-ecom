# -*- coding: utf-8 -*-
"""
Kalan OYP no-image görsellerini ETag (MD5 içerik hash'i) ile tespit eder.
OYP placeholder içerik olarak aynı olduğundan her URL farklı olsa da ETag aynıdır.
Eşleşen kayıtlar standart no-image ile değiştirilir.
"""
import os, sys, json
import paramiko
from concurrent.futures import ThreadPoolExecutor, as_completed

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
pg_user  = os.environ.get('POSTGRES_USER', 'ecom')
pg_db    = os.environ.get('POSTGRES_DB', 'EcomDb')

NO_IMAGE = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'
SAMPLE_SIZE = 500  # Kaç URL örneklenecek
CONCURRENCY = 20   # Paralel HEAD istek sayısı
# ETag'i bu kadar farklı URL'de görürsek şüpheli say
SUSPECT_THRESHOLD = 10

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

def run_sql(sql, timeout=60):
    stdin, stdout, stderr = client.exec_command(
        f'docker exec -i ecom-postgres-1 psql -U {pg_user} -d {pg_db}', timeout=timeout)
    stdin.write(sql)
    stdin.channel.shutdown_write()
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

# 1. Mevcut R2 ürün görseli sayısı
print("=== Mevcut R2 Ürün Görseli Durumu ===")
print(run_sql(f"""
SELECT
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%') AS r2_product,
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}') AS no_image
FROM "ProductImages"
WHERE "IsDeleted" = false;
"""))

# 2. Rastgele örnek URL'ler çek
print(f"\n=== {SAMPLE_SIZE} Rastgele R2 Ürün Görseli Örnekleniyor ===")
sample_result = run_sql(f"""
SELECT "ImageUrl"
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%'
ORDER BY random()
LIMIT {SAMPLE_SIZE};
""")

urls = [line.strip() for line in sample_result.split('\n')
        if line.strip().startswith('https://')]
print(f"Örneklenen URL sayısı: {len(urls)}")

if not urls:
    print("URL bulunamadı.")
    client.close()
    sys.exit(0)

# 3. Sunucu üzerinden paralel HEAD istekleri ile ETag al
print(f"\n=== Sunucu Üzerinden ETag Kontrolü ({CONCURRENCY} paralel) ===")

def get_etag(url):
    cmd = f"curl -s -I --max-time 10 '{url}' 2>/dev/null | grep -i 'etag\\|content-length'"
    result = run(cmd, timeout=15)
    etag = None
    size = None
    for line in result.split('\n'):
        l = line.lower().strip()
        if l.startswith('etag:'):
            etag = line.split(':', 1)[1].strip().strip('"').strip()
        elif l.startswith('content-length:'):
            size = line.split(':', 1)[1].strip()
    return url, etag, size

etag_counts = {}   # etag -> count
etag_urls = {}     # etag -> sample urls
size_counts = {}   # size -> count

done = 0
for url in urls:
    url_stripped, etag, size = get_etag(url)
    done += 1
    if done % 50 == 0:
        print(f"  {done}/{len(urls)} kontrol edildi...")
    if etag:
        etag_counts[etag] = etag_counts.get(etag, 0) + 1
        if etag not in etag_urls:
            etag_urls[etag] = []
        if len(etag_urls[etag]) < 3:
            etag_urls[etag].append(url)
    if size:
        size_counts[size] = size_counts.get(size, 0) + 1

# 4. Şüpheli ETag'leri listele
print("\n=== Sık Tekrar Eden ETag'ler (şüpheli OYP placeholder adayları) ===")
suspect_etags = [(etag, cnt) for etag, cnt in etag_counts.items() if cnt >= SUSPECT_THRESHOLD]
suspect_etags.sort(key=lambda x: -x[1])

if not suspect_etags:
    print(f"Hiç şüpheli ETag bulunamadı (threshold: {SUSPECT_THRESHOLD})")
    # Yine de ilk 10'u göster
    top_etags = sorted(etag_counts.items(), key=lambda x: -x[1])[:10]
    for etag, cnt in top_etags:
        print(f"  ETag: {etag[:32]}... | Sayı: {cnt}")
else:
    for etag, cnt in suspect_etags[:10]:
        sample = etag_urls.get(etag, [])
        print(f"  ETag: {etag[:32]}... | Örnekte: {cnt} kez")
        for s in sample[:2]:
            print(f"    {s}")

# 5. En sık tekrar eden boyutlar
print("\n=== En Sık Tekrar Eden Dosya Boyutları ===")
top_sizes = sorted(size_counts.items(), key=lambda x: -x[1])[:10]
for sz, cnt in top_sizes:
    print(f"  {sz} bytes: {cnt} kez")

if not suspect_etags:
    client.close()
    print("\nŞüpheli ETag bulunamadı. Daha büyük örnek veya düşük threshold deneyin.")
    sys.exit(0)

# 6. Onay sor
print(f"\n{len(suspect_etags)} şüpheli ETag bulundu.")
print("Bu ETag'lere sahip TÜM R2 ürün görsellerini no-image ile değiştirmek için:")
print("  Bu scriptde CONFIRM = True yap ve tekrar çalıştır.")

CONFIRM = False  # Onaylamak için True yap

if not CONFIRM:
    client.close()
    print("\nOnay bekleniyor. CONFIRM = True yaparak tekrar çalıştır.")
    sys.exit(0)

# 7. Gerçek URL listesini çek ve ETag ile karşılaştır
print("\n=== Tüm R2 Ürün Görselleri ETag Kontrolü ===")
print("Bu işlem uzun sürebilir...")

all_urls_result = run_sql("""
SELECT "Id"::text, "ImageUrl"
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%'
ORDER BY random();
""")

suspect_ids = []
for line in all_urls_result.split('\n'):
    if '|' not in line:
        continue
    parts = line.split('|')
    if len(parts) < 2:
        continue
    img_id = parts[0].strip()
    url = parts[1].strip()
    if not url.startswith('https://'):
        continue
    _, etag, _ = get_etag(url)
    if etag and any(etag == se for se, _ in suspect_etags):
        suspect_ids.append(img_id)

print(f"Değiştirilecek kayıt sayısı: {len(suspect_ids)}")

if suspect_ids:
    id_list = "','".join(suspect_ids)
    print(run_sql(f"""
UPDATE "ProductImages"
SET "ImageUrl" = '{NO_IMAGE}', "UpdatedDate" = NOW()
WHERE "Id" IN ('{id_list}');
SELECT CONCAT('Güncellenen: ', COUNT(*)) FROM "ProductImages"
WHERE "ImageUrl" = '{NO_IMAGE}' AND "UpdatedDate" > NOW() - INTERVAL '1 minute';
""", timeout=120))

client.close()
print("\n=== TAMAMLANDI ===")
