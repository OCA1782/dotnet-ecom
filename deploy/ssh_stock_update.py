import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=120):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t):
    print(t.encode('ascii', 'replace').decode('ascii'))

p("=== Mevcut WarehouseCode degerleri ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT "WarehouseCode", COUNT(*) FROM "Stocks"
WHERE "IsDeleted" = false
GROUP BY "WarehouseCode"
ORDER BY COUNT(*) DESC
LIMIT 5;
' 2>&1"""))

p("\n=== ADIM 1: Mevcut 0-stok kayitlari guncelle ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c '
UPDATE "Stocks"
SET "Quantity" = "ReservedQuantity" + 20,
    "UpdatedDate" = NOW()
WHERE "IsDeleted" = false
  AND ("Quantity" - "ReservedQuantity") <= 0;
' 2>&1"""))

p("\n=== ADIM 2: Stok kaydi olmayan aktif+yayinda urunlere kayit ekle ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c '
INSERT INTO "Stocks" (
  "Id", "ProductId", "ProductVariantId",
  "WarehouseCode", "Quantity", "ReservedQuantity",
  "CriticalStockLevel", "CreatedDate", "IsDeleted", "DataSource"
)
SELECT
  gen_random_uuid(),
  p."Id",
  NULL,
  $$DEFAULT$$,
  20,
  0,
  0,
  NOW(),
  false,
  $$merchant-init$$
FROM "Products" p
WHERE p."IsDeleted" = false
  AND p."IsActive" = true
  AND p."IsPublished" = true
  AND NOT EXISTS (
    SELECT 1 FROM "Stocks" s
    WHERE s."ProductId" = p."Id" AND s."IsDeleted" = false
  );
' 2>&1""", timeout=180))

p("\n=== SONUC: Feed icin stok durumu ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT
  COUNT(*) FILTER (WHERE (s."Quantity" - s."ReservedQuantity") > 0) AS in_stock,
  COUNT(*) FILTER (WHERE (s."Quantity" - s."ReservedQuantity") <= 0) AS out_of_stock
FROM "Products" p
INNER JOIN "Stocks" s ON s."ProductId" = p."Id" AND s."IsDeleted" = false
WHERE p."IsDeleted" = false AND p."IsActive" = true AND p."IsPublished" = true;
' 2>&1"""))

client.close()
