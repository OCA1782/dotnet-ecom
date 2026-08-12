#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Check and fix performance issues on production server."""

import os, sys, paramiko
sys.stdout.reconfigure(encoding='utf-8')

HOST = '31.210.40.242'
USER = 'bilgi'
PASSWORD = os.environ.get('DEPLOY_SSH_PASSWORD', 'nAqAcUFeb9vUbruMon0b!')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

def run(cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    o = stdout.read().decode('utf-8', errors='replace')
    e = stderr.read().decode('utf-8', errors='replace')
    return o, e

def psql(sql, timeout=30):
    safe = sql.replace('"', '\\"').replace("'", "'\\''")
    cmd = f"docker exec ecom-postgres-1 psql -U ecom EcomDb -c '{safe}' 2>&1"
    out, _ = run(cmd, timeout)
    return out

# ========================
# 1. R2 IMAGE CACHE CHECK
# ========================
print("=== 1. SAMPLE IMAGE CACHE HEADERS (R2) ===")
out, _ = run('''
SAMPLE=$(docker exec ecom-postgres-1 psql -U ecom EcomDb -t -c "SELECT \\"ImageUrl\\" FROM \\"ProductImages\\" WHERE \\"ImageUrl\\" IS NOT NULL AND \\"ImageUrl\\" != \\'\\' LIMIT 1;" 2>/dev/null | tr -d " \t\n")
echo "Sample image: $SAMPLE"
if [ -n "$SAMPLE" ]; then
    curl -sI --max-time 10 "$SAMPLE" 2>/dev/null | grep -iE "cache-control|cf-cache|content-length|etag|expires|age|vary"
fi
''', timeout=30)
print(out)

# ========================
# 2. NGINX GZIP STATUS
# ========================
print("=== 2. NGINX MAIN GZIP CONFIG ===")
out, _ = run("grep -n 'gzip' /etc/nginx/nginx.conf 2>/dev/null | head -20")
print(out if out.strip() else "No gzip in nginx.conf")
out, _ = run("grep -n 'gzip' /etc/nginx/sites-enabled/autoforcepart.conf 2>/dev/null | head -20")
print(out if out.strip() else "No gzip in autoforcepart.conf")

# ========================
# 3. EXPLAIN ANALYZE — VEHICLE MODEL COUNT QUERY
# ========================
print("=== 3. EXPLAIN ANALYZE — count(*) with VehicleModel=Opel ===")
out, _ = run('''
docker exec ecom-postgres-1 psql -U ecom EcomDb -c "EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) FROM \\"Products\\" p
WHERE p.\\"IsDeleted\\" = false
  AND p.\\"IsActive\\" = true
  AND p.\\"IsPublished\\" = true
  AND (
    (p.\\"VehicleModel\\" IS NOT NULL AND p.\\"VehicleModel\\" ILIKE 'Opel%')
    OR p.\\"Name\\" ILIKE 'Opel'
    OR p.\\"Name\\" ILIKE 'Opel %'
    OR p.\\"Name\\" ILIKE '% Opel %'
    OR p.\\"Name\\" ILIKE '% Opel'
  );" 2>&1''', timeout=60)
print(out)

# ========================
# 4. HOW MANY OPEL PRODUCTS?
# ========================
print("=== 4. OPEL PRODUCT COUNTS ===")
out, _ = run('''
docker exec ecom-postgres-1 psql -U ecom EcomDb -c "
SELECT
  COUNT(*) FILTER (WHERE \\"VehicleModel\\" ILIKE 'Opel%') AS vehicle_model_match,
  COUNT(*) FILTER (WHERE \\"Name\\" ILIKE '% Opel %' OR \\"Name\\" ILIKE 'Opel %') AS name_match,
  COUNT(*) AS total_active
FROM \\"Products\\"
WHERE \\"IsDeleted\\" = false AND \\"IsActive\\" = true AND \\"IsPublished\\" = true;" 2>&1''', timeout=60)
print(out)

# ========================
# 5. NGINX MAIN CONFIG HEAD
# ========================
print("=== 5. NGINX MAIN CONFIG (worker/event settings) ===")
out, _ = run("head -40 /etc/nginx/nginx.conf 2>/dev/null")
print(out)

client.close()
print("\nDone.")
