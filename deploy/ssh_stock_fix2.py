import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=180):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t):
    print(t.encode('ascii', 'replace').decode('ascii'))

# Silinmis (IsDeleted=true) stok kaydi olan aktif urunleri geri getir
p("=== Adim A: Silindi isaretli stok kayitlarini geri getir ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c '
UPDATE "Stocks" s
SET "IsDeleted"        = false,
    "Quantity"         = 20,
    "ReservedQuantity" = 0,
    "UpdatedDate"      = NOW(),
    "DataSource"       = $$merchant-init$$
FROM "Products" p
WHERE s."ProductId" = p."Id"
  AND s."IsDeleted"    = true
  AND p."IsDeleted"    = false
  AND p."IsActive"     = true
  AND p."IsPublished"  = true;
' 2>&1"""))

# Hic stok kaydi olmayan aktif urunlere yeni kayit ekle
p("\n=== Adim B: Hic stok kaydi olmayan urunlere INSERT ===")
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
WHERE p."IsDeleted"   = false
  AND p."IsActive"    = true
  AND p."IsPublished" = true
  AND NOT EXISTS (
    SELECT 1 FROM "Stocks" s WHERE s."ProductId" = p."Id"
  );
' 2>&1""", timeout=300))

p("\n=== FINAL: Aktif+Yayinda urun stok durumu ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT
  COUNT(*) FILTER (WHERE (s."Quantity" - s."ReservedQuantity") > 0) AS in_stock,
  COUNT(*) FILTER (WHERE (s."Quantity" - s."ReservedQuantity") <= 0) AS still_zero,
  COUNT(*) AS total
FROM "Products" p
LEFT JOIN "Stocks" s ON s."ProductId" = p."Id" AND s."IsDeleted" = false
WHERE p."IsDeleted" = false AND p."IsActive" = true AND p."IsPublished" = true;
' 2>&1"""))

client.close()
