# -*- coding: utf-8 -*-
"""
Creates Stock records (qty=50, WarehouseCode='DEFAULT') for products without stock.
Uses SFTP to write SQL to avoid shell encoding issues.
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
pg_user  = os.environ.get('POSTGRES_USER', 'ecom')
pg_db    = os.environ.get('POSTGRES_DB', 'EcomDb')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run_sql_file(sql, timeout=120):
    sftp = client.open_sftp()
    with sftp.open('/tmp/fix_stocks.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    stdin, stdout, stderr = client.exec_command(
        f'docker exec -i ecom-postgres-1 psql -U {pg_user} -d {pg_db}',
        timeout=timeout)
    stdin.write(sql)
    stdin.channel.shutdown_write()
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

# 1. Show products without stock
sql_missing = '''
SELECT p."Id", p."Name", p."SKU"
FROM "Products" p
WHERE p."IsDeleted" = false
  AND NOT EXISTS (SELECT 1 FROM "Stocks" s WHERE s."ProductId" = p."Id")
LIMIT 20;
'''
print("=== Stok kaydı olmayan ürünler ===")
print(run_sql_file(sql_missing))

# 2. Show stock distribution
sql_dist = '''
SELECT
  COUNT(*) FILTER (WHERE s."Quantity" = 0) AS zero_stock,
  COUNT(*) FILTER (WHERE s."Quantity" > 0 AND s."Quantity" < 10) AS low_stock,
  COUNT(*) FILTER (WHERE s."Quantity" >= 10) AS ok_stock,
  COUNT(*) AS total_stock_records
FROM "Stocks" s
JOIN "Products" p ON p."Id" = s."ProductId"
WHERE p."IsDeleted" = false AND s."IsDeleted" = false;
'''
print("\n=== Stok dağılımı ===")
print(run_sql_file(sql_dist))

# 3. Insert missing stock records
sql_fix = '''
INSERT INTO "Stocks" (
    "Id", "ProductId", "ProductVariantId",
    "WarehouseCode", "Quantity", "ReservedQuantity", "CriticalStockLevel",
    "CreatedDate", "UpdatedDate", "IsDeleted", "DataSource"
)
SELECT
    gen_random_uuid(),
    p."Id",
    NULL,
    'DEFAULT',
    50,
    0,
    5,
    NOW(),
    NOW(),
    false,
    NULL
FROM "Products" p
WHERE p."IsDeleted" = false
  AND NOT EXISTS (SELECT 1 FROM "Stocks" s WHERE s."ProductId" = p."Id");

SELECT CONCAT('Oluşturulan stok sayısı: ', COUNT(*)) AS result
FROM "Stocks" s
JOIN "Products" p ON p."Id" = s."ProductId"
WHERE p."IsDeleted" = false
  AND s."IsDeleted" = false
  AND s."CreatedDate" > NOW() - INTERVAL '1 minute';
'''
print("\n=== Eksik stok kayıtları oluşturuluyor ===")
print(run_sql_file(sql_fix))

# 4. Final verification
sql_verify = '''
SELECT
  COUNT(*) AS total_products,
  (SELECT COUNT(*) FROM "Products" p2
   WHERE p2."IsDeleted" = false
   AND NOT EXISTS (SELECT 1 FROM "Stocks" s WHERE s."ProductId" = p2."Id")
  ) AS still_missing
FROM "Products"
WHERE "IsDeleted" = false;
'''
print("\n=== Son durum ===")
print(run_sql_file(sql_verify))

client.close()
print("\n=== TAMAMLANDI ===")
