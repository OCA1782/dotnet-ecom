# -*- coding: utf-8 -*-
"""
BulutX Ecom DB'de ProductImages tablosundaki no-image URL'lerini
https://images.autoforcepart.com/static/autoforcepart-no-image.png ile değiştirir.

Hedef pattern'lar:
  1. onlineyedekparca.com domain'inden no-image URL'leri
  2. Diğer domain'lerden no-image URL'leri (genel pattern)
  3. Eski autoforcepart.com no-image URL'leri

Tablolar: ProductImages.ImageUrl, Products.ImageUrl (varsa)
"""
import os, sys
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

R2_NO_IMAGE = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

# Yakalanacak no-image pattern'ları (URL path kısmında geçen ifadeler)
NO_IMAGE_PATTERNS = [
    'no-image', 'no_image', 'noimage',
    'placeholder', 'resim-yok', 'gorsel-yok',
]

def _pattern_clause(col='"ImageUrl"'):
    parts = [f"{col} ILIKE '%{p}%'" for p in NO_IMAGE_PATTERNS]
    return '(' + ' OR '.join(parts) + ')'


client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)


def pg(sql, timeout=300):
    """SQL'i stdin üzerinden psql'e gönderir."""
    stdin, stdout, stderr = client.exec_command(
        'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t',
        timeout=timeout,
    )
    stdin.write(sql.encode('utf-8'))
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()


def count(sql):
    result = pg(sql)
    try:
        return int(result.strip().splitlines()[-1].strip())
    except Exception:
        return -1


def show_samples(label, sql, limit=10):
    rows = pg(sql)
    if rows:
        print(f'{label}:\n' + '\n'.join(f'  {r}' for r in rows.splitlines()[:limit]))
    else:
        print(f'{label}: (yok)')


print('=' * 60)
print('BulutX No-Image URL Düzeltme')
print('=' * 60)

# --- 1. Analiz ---
print('\n[1] Mevcut no-image URL analizi')

# onlineyedekparca.com tüm URL'leri
n_oyp_all = count(
    'SELECT COUNT(*) FROM "ProductImages" WHERE "ImageUrl" ILIKE \'%onlineyedekparca%\';'
)
print(f'  ProductImages -> onlineyedekparca.com (tümü)   : {n_oyp_all:,}')

# onlineyedekparca.com + no-image pattern
n_oyp_ni = count(f'''
SELECT COUNT(*) FROM "ProductImages"
WHERE "ImageUrl" ILIKE \'%onlineyedekparca%\'
  AND {_pattern_clause()};
''')
print(f'  ProductImages -> onlineyedekparca.com (no-image): {n_oyp_ni:,}')

# Diğer domain'lerden no-image (R2 olmayan)
n_other = count(f'''
SELECT COUNT(*) FROM "ProductImages"
WHERE "ImageUrl" NOT LIKE \'https://images.autoforcepart.com/%\'
  AND {_pattern_clause()};
''')
print(f'  ProductImages -> diğer domain no-image          : {n_other:,}')

# Eski autoforcepart no-image
n_afp = count(f'''
SELECT COUNT(*) FROM "ProductImages"
WHERE "ImageUrl" NOT LIKE \'https://images.autoforcepart.com/static/%\'
  AND "ImageUrl" ILIKE \'%autoforcepart%\'
  AND {_pattern_clause()};
''')
print(f'  ProductImages -> eski autoforcepart no-image    : {n_afp:,}')

# --- 2. Örnekler ---
print('\n[2] onlineyedekparca.com no-image URL örnekleri')
show_samples('', f'''
SELECT DISTINCT "ImageUrl" FROM "ProductImages"
WHERE "ImageUrl" ILIKE \'%onlineyedekparca%\'
  AND {_pattern_clause()}
LIMIT 10;
''')

print('\n[2b] Diğer domain no-image URL örnekleri (ilk 10)')
show_samples('', f'''
SELECT DISTINCT "ImageUrl" FROM "ProductImages"
WHERE "ImageUrl" NOT LIKE \'https://images.autoforcepart.com/%\'
  AND {_pattern_clause()}
LIMIT 10;
''')

# --- 3. Güncellemeler ---
print('\n[3] Güncelleme başlıyor...')

# 3a. onlineyedekparca.com no-image → R2 no-image
if n_oyp_ni > 0:
    print(f'  -> onlineyedekparca.com: {n_oyp_ni:,} kayıt güncelleniyor...')
    r = pg(f'''
UPDATE "ProductImages"
SET "ImageUrl" = \'{R2_NO_IMAGE}\'
WHERE "ImageUrl" ILIKE \'%onlineyedekparca%\'
  AND {_pattern_clause()};
''')
    print(f'     {r or "OK"}')
else:
    print('  -> onlineyedekparca.com: güncellenecek kayıt yok.')

# 3b. Diğer domain'ler no-image → R2 no-image
if n_other > 0:
    print(f'  -> Diğer domain no-image: {n_other:,} kayıt güncelleniyor...')
    r = pg(f'''
UPDATE "ProductImages"
SET "ImageUrl" = \'{R2_NO_IMAGE}\'
WHERE "ImageUrl" NOT LIKE \'https://images.autoforcepart.com/%\'
  AND {_pattern_clause()};
''')
    print(f'     {r or "OK"}')
else:
    print('  -> Diğer domain no-image: güncellenecek kayıt yok.')

# 3c. Eski autoforcepart no-image (extra guard)
if n_afp > 0:
    print(f'  -> Eski autoforcepart no-image: {n_afp:,} kayıt güncelleniyor...')
    r = pg(f'''
UPDATE "ProductImages"
SET "ImageUrl" = \'{R2_NO_IMAGE}\'
WHERE "ImageUrl" NOT LIKE \'https://images.autoforcepart.com/static/%\'
  AND "ImageUrl" ILIKE \'%autoforcepart%\'
  AND {_pattern_clause()};
''')
    print(f'     {r or "OK"}')

# 3d. Products tablosundaki image sütunları
print('\n[3d] Products.ImageUrl kontrolü...')
cols_raw = pg('''
SELECT column_name FROM information_schema.columns
WHERE table_name = \'Products\' AND column_name ILIKE \'%image%\';
''')
image_cols = [c.strip() for c in cols_raw.splitlines() if c.strip()]
if image_cols:
    for col in image_cols:
        c = f'"{col}"'
        n_prod = count(f'''
SELECT COUNT(*) FROM "Products"
WHERE {c} NOT LIKE \'https://images.autoforcepart.com/%\'
  AND {_pattern_clause(c)};
''')
        print(f'  Products.{col}: {n_prod:,}')
        if n_prod > 0:
            pg(f'''
UPDATE "Products"
SET {c} = \'{R2_NO_IMAGE}\'
WHERE {c} NOT LIKE \'https://images.autoforcepart.com/%\'
  AND {_pattern_clause(c)};
''')
            print(f'     -> Güncellendi.')
else:
    print('  Products tablosunda image sütunu bulunamadı.')

# --- 4. Doğrulama ---
print('\n[4] Doğrulama')

remain_oyp = count(f'''
SELECT COUNT(*) FROM "ProductImages"
WHERE "ImageUrl" ILIKE \'%onlineyedekparca%\'
  AND {_pattern_clause()};
''')
print(f'  Kalan onlineyedekparca no-image : {remain_oyp:,}')

remain_other = count(f'''
SELECT COUNT(*) FROM "ProductImages"
WHERE "ImageUrl" NOT LIKE \'https://images.autoforcepart.com/%\'
  AND {_pattern_clause()};
''')
print(f'  Kalan diğer domain no-image     : {remain_other:,}')

total_r2_ni = count(f'''
SELECT COUNT(*) FROM "ProductImages"
WHERE "ImageUrl" = \'{R2_NO_IMAGE}\';
''')
print(f'  Toplam R2 no-image URL          : {total_r2_ni:,}')

print('\n' + '=' * 60)
print('No-image URL düzeltme tamamlandı.')
print('=' * 60)

client.close()
