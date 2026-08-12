#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, paramiko
sys.stdout.reconfigure(encoding='utf-8')

HOST = '31.210.40.242'
USER = 'bilgi'
PASSWORD = os.environ.get('DEPLOY_SSH_PASSWORD', 'nAqAcUFeb9vUbruMon0b!')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

def psql(sql, timeout=30):
    cmd = f'docker exec ecom-postgres-1 psql -U ecom EcomDb -c "{sql}" 2>&1'
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace') + stderr.read().decode('utf-8', errors='replace')

print("=== 1. Products table row count ===")
print(psql('SELECT COUNT(*) as total FROM "Products" WHERE "IsDeleted" = false'))

print("=== 2. Products columns ===")
print(psql("""SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Products' ORDER BY ordinal_position"""))

print("=== 3. Existing indexes on Products ===")
print(psql("""SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Products' ORDER BY indexname"""))

print("=== 4. Existing indexes on ProductImages ===")
print(psql("""SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ProductImages' ORDER BY indexname"""))

print("=== 5. Row counts ===")
print(psql("""
SELECT relname AS table_name,
       n_live_tup AS rows,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
WHERE relname IN ('Products','ProductImages','Brands','Categories')
ORDER BY n_live_tup DESC
"""))

print("=== 6. EXPLAIN count(*) with active filter ===")
print(psql('EXPLAIN SELECT COUNT(*) FROM "Products" WHERE "IsDeleted" = false AND "IsActive" = true'))

print("=== 7. VehicleMakes / VehicleModels tables ===")
print(psql("""SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'VehicleMakes' ORDER BY ordinal_position"""))
print(psql("""SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'VehicleModels' ORDER BY ordinal_position"""))

client.close()
