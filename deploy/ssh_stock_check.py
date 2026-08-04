import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=30):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t):
    print(t.encode('ascii', 'replace').decode('ascii'))

p("=== Stocks tablo yapisi ===")
p(r(r'docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c "\d \"Stocks\"" 2>&1'))

p("\n=== Stok ozeti ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT
  COUNT(*) FILTER (WHERE "Quantity" - "ReservedQuantity" <= 0) AS zero_or_negative,
  COUNT(*) FILTER (WHERE "Quantity" - "ReservedQuantity" > 0) AS positive,
  COUNT(*) AS total_stock_records
FROM "Stocks"
WHERE "IsDeleted" = false;
' 2>&1"""))

p("\n=== Aktif+Yayinda urun sayisi (stock kaydi olan) ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT COUNT(*) FROM "Products" p
INNER JOIN "Stocks" s ON s."ProductId" = p."Id" AND s."IsDeleted" = false
WHERE p."IsDeleted" = false AND p."IsActive" = true AND p."IsPublished" = true
AND (s."Quantity" - s."ReservedQuantity") <= 0;
' 2>&1"""))

p("\n=== Aktif+Yayinda urun - stock kaydi YOK ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT COUNT(*) FROM "Products" p
WHERE p."IsDeleted" = false AND p."IsActive" = true AND p."IsPublished" = true
AND NOT EXISTS (
  SELECT 1 FROM "Stocks" s WHERE s."ProductId" = p."Id" AND s."IsDeleted" = false
);
' 2>&1"""))

p("\n=== Stocks - ek kolonlar var mi? ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT "Id","ProductId","Quantity","ReservedQuantity","IsDeleted"
FROM "Stocks" LIMIT 3;
' 2>&1"""))

client.close()
