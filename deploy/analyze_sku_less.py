# -*- coding: utf-8 -*-
import os, paramiko, io, sys
sys.stdout.reconfigure(encoding='utf-8')

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(_env, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.environ['DEPLOY_SSH_HOST'],
            username=os.environ['DEPLOY_SSH_USER'],
            password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=30)
sftp = ssh.open_sftp()

sql = r"""
\echo '=== ANALIZ 1: Kombinasyon seviyelerinde duplicate grup sayisi ==='
SELECT
  (SELECT COUNT(*) FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NULL)
    AS sku_bos_toplam,

  (SELECT COUNT(*) FROM (
    SELECT "Name" FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NULL
    GROUP BY "Name" HAVING COUNT(*)>1) x)
    AS dup_grup__name,

  (SELECT COUNT(*) FROM (
    SELECT "Name","BrandId" FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NULL
    GROUP BY "Name","BrandId" HAVING COUNT(*)>1) x)
    AS dup_grup__name_brand,

  (SELECT COUNT(*) FROM (
    SELECT "Name","BrandId","CategoryId" FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NULL
    GROUP BY "Name","BrandId","CategoryId" HAVING COUNT(*)>1) x)
    AS dup_grup__name_brand_cat,

  (SELECT COUNT(*) FROM (
    SELECT "Name","BrandId","CategoryId","VehicleModel" FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NULL
    GROUP BY "Name","BrandId","CategoryId","VehicleModel" HAVING COUNT(*)>1) x)
    AS dup_grup__name_brand_cat_vehicle,

  (SELECT COUNT(*) FROM (
    SELECT "Name","BrandId","CategoryId","VehicleModel","Price" FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NULL
    GROUP BY "Name","BrandId","CategoryId","VehicleModel","Price" HAVING COUNT(*)>1) x)
    AS dup_grup__plus_price,

  (SELECT COUNT(*) FROM (
    SELECT "Name","BrandId","CategoryId","VehicleModel","Price","Description" FROM "Products" WHERE "IsDeleted"=false AND "SKU" IS NULL
    GROUP BY "Name","BrandId","CategoryId","VehicleModel","Price","Description" HAVING COUNT(*)>1) x)
    AS dup_grup__plus_desc;

\echo ''
\echo '=== ANALIZ 2: 6 alan tamamen ayni olanlarda fazladan kayit sayisi ==='
SELECT
  SUM(cnt-1)   AS fazladan_kayit,
  COUNT(*)     AS grup_sayisi,
  MAX(cnt)     AS en_cok_tekrar,
  ROUND(AVG(cnt),2) AS ort_tekrar
FROM (
  SELECT "Name","BrandId","CategoryId","VehicleModel","Price","Description",
         COUNT(*) AS cnt
  FROM "Products"
  WHERE "IsDeleted"=false AND "SKU" IS NULL
  GROUP BY "Name","BrandId","CategoryId","VehicleModel","Price","Description"
  HAVING COUNT(*) > 1
) sub;

\echo ''
\echo '=== ANALIZ 3: Scraping/hata sayfasi kayitlari ==='
SELECT "Name", COUNT(*) AS adet
FROM "Products"
WHERE "IsDeleted"=false AND "SKU" IS NULL
  AND ("Name" ILIKE '%sayfa bulunamad%'
    OR "Name" ILIKE '%site g%ncelleniyor%'
    OR "Name" ILIKE '%gecersiz istek%'
    OR "Name" ILIKE '%web server is down%'
    OR "Name" ILIKE '%access denied%'
    OR "Name" ILIKE '%forbidden%'
    OR "Name" ILIKE '%not found%'
    OR "Name" ILIKE '%error%'
    OR "Name" ILIKE '%404%'
    OR "Name" ILIKE '%503%'
  )
GROUP BY "Name" ORDER BY adet DESC LIMIT 15;

\echo ''
\echo '=== ANALIZ 4: VehicleModel dolu/bos (araclari ayirdirir mi?) ==='
SELECT
  COUNT(*) FILTER (WHERE "VehicleModel" IS NOT NULL AND "VehicleModel" != '') AS vehicle_dolu,
  COUNT(*) FILTER (WHERE "VehicleModel" IS NULL OR "VehicleModel" = '')       AS vehicle_bos
FROM "Products"
WHERE "IsDeleted"=false AND "SKU" IS NULL;

\echo ''
\echo '=== ANALIZ 5: DataSource dagılımı (SKU bos) ==='
SELECT COALESCE("DataSource",'(null)') AS source, COUNT(*) AS adet
FROM "Products"
WHERE "IsDeleted"=false AND "SKU" IS NULL
GROUP BY "DataSource" ORDER BY adet DESC;

\echo ''
\echo '=== ANALIZ 6: Price=0 veya cok dusuk fiyatlı urunler ==='
SELECT
  COUNT(*) FILTER (WHERE "Price" = 0)    AS fiyat_sifir,
  COUNT(*) FILTER (WHERE "Price" < 1)    AS fiyat_1tl_alti,
  COUNT(*) FILTER (WHERE "Price" IS NULL) AS fiyat_null
FROM "Products"
WHERE "IsDeleted"=false AND "SKU" IS NULL;

\echo ''
\echo '=== ANALIZ 7: IsActive / IsPublished durumu ==='
SELECT
  COUNT(*) FILTER (WHERE "IsActive"=true  AND "IsPublished"=true)  AS aktif_yayinda,
  COUNT(*) FILTER (WHERE "IsActive"=true  AND "IsPublished"=false) AS aktif_yayinda_degil,
  COUNT(*) FILTER (WHERE "IsActive"=false)                         AS pasif
FROM "Products"
WHERE "IsDeleted"=false AND "SKU" IS NULL;

\echo ''
\echo '=== ANALIZ 8: 6 alan ayni olan duplicate ornekleri (top 10 grup) ==='
SELECT
  LEFT(p."Name", 80) AS isim,
  ROUND(p."Price",2) AS fiyat,
  LEFT(COALESCE(p."VehicleModel",'(yok)'), 40) AS arac_modeli,
  COALESCE(b."Name",'(marka yok)') AS marka,
  cnt AS tekrar_sayisi
FROM "Products" p
LEFT JOIN "Brands" b ON b."Id" = p."BrandId"
JOIN (
  SELECT "Name","BrandId","CategoryId","VehicleModel","Price","Description",
         COUNT(*) AS cnt,
         MIN("Id"::text) AS ornek_id
  FROM "Products"
  WHERE "IsDeleted"=false AND "SKU" IS NULL
  GROUP BY "Name","BrandId","CategoryId","VehicleModel","Price","Description"
  HAVING COUNT(*) > 1
  ORDER BY cnt DESC
  LIMIT 10
) dup
  ON dup.ornek_id = p."Id"::text
WHERE p."IsDeleted"=false
ORDER BY cnt DESC;

\echo ''
\echo '=== ANALIZ 9: Name bos veya cok kisa urunler ==='
SELECT
  COUNT(*) FILTER (WHERE "Name" IS NULL OR "Name" = '')  AS isim_bos,
  COUNT(*) FILTER (WHERE LENGTH("Name") < 5)             AS isim_5kar_alti,
  COUNT(*) FILTER (WHERE LENGTH("Name") < 10)            AS isim_10kar_alti
FROM "Products"
WHERE "IsDeleted"=false AND "SKU" IS NULL;

\echo ''
\echo '=== ANALIZ 10: Chassis/OemPartNumber dolu olanlarda duplicate ==='
SELECT
  COUNT(*) FILTER (WHERE "OemPartNumber" IS NOT NULL) AS oem_dolu,
  COUNT(*) FILTER (WHERE "Chassis" IS NOT NULL)       AS chassis_dolu,
  COUNT(DISTINCT "OemPartNumber") FILTER (WHERE "OemPartNumber" IS NOT NULL) AS uniq_oem,
  COUNT(DISTINCT "Chassis") FILTER (WHERE "Chassis" IS NOT NULL)             AS uniq_chassis
FROM "Products"
WHERE "IsDeleted"=false AND "SKU" IS NULL;
"""

sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/tmp/sku_bos_analysis.sql')
sftp.close()

print('Analiz calistiriliyor (yaklasik 60-90 saniye)...')
_, out, err = ssh.exec_command(
    'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/sku_bos_analysis.sql',
    timeout=300
)
print(out.read().decode('utf-8', errors='replace'))
e = err.read().decode('utf-8', errors='replace').strip()
if e:
    print('STDERR:', e[:500])
ssh.close()
print('Tamamlandi.')
