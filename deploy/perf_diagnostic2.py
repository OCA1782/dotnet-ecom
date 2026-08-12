#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Performance diagnostic part 2 — nginx config, slow queries, indexes."""

import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

HOST = '31.210.40.242'
USER = 'bilgi'
PASSWORD = os.environ.get('DEPLOY_SSH_PASSWORD', 'nAqAcUFeb9vUbruMon0b!')

def run(client, cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

print("=" * 60)
print("A. NGINX FULL CONFIG")
print("=" * 60)
out, _ = run(client, 'cat /etc/nginx/sites-enabled/autoforcepart.conf 2>/dev/null || cat /etc/nginx/conf.d/autoforcepart.conf 2>/dev/null')
print(out)

print("=" * 60)
print("B. API - SEARCH ENDPOINT DISCOVERY")
print("=" * 60)
out, _ = run(client, '''
echo "--- /api/search/suggestions?q=opel ---"
curl -sf "http://localhost:15124/api/search/suggestions?q=opel" -w "\nHTTP %{http_code}\n" 2>/dev/null | head -5
echo "--- /api/products/search?q=opel ---"
curl -sf "http://localhost:15124/api/products/search?q=opel" -w "\nHTTP %{http_code}\n" 2>/dev/null | head -5
echo "--- /api/products/suggestions?q=opel ---"
curl -sf "http://localhost:15124/api/products/suggestions?q=opel" -w "\nHTTP %{http_code}\n" 2>/dev/null | head -5
echo "--- /api/search?q=opel ---"
curl -sf "http://localhost:15124/api/search?q=opel" -w "\nHTTP %{http_code}\n" 2>/dev/null | head -5
''')
print(out)

print("=" * 60)
print("C. POSTGRESQL SLOW QUERIES & INDEX DURUMU")
print("=" * 60)
out, _ = run(client, '''
docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c "
-- Mevcut indexler
SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    string_agg(a.attname, ', ' ORDER BY ix.indkey_index) AS columns
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid
JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS ik(num, indkey_index) ON a.attnum = ik.num
WHERE t.relname IN ('products', 'product_images', 'brands', 'categories', 'vehicle_makes', 'vehicle_models')
GROUP BY t.relname, i.relname
ORDER BY t.relname, i.relname;
" 2>/dev/null
''')
print(out)

print("=" * 60)
print("D. PRODUCTS TABLO SATIR SAYISI VE BUYUKLUGu")
print("=" * 60)
out, _ = run(client, '''
docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c "
SELECT
    relname AS table_name,
    n_live_tup AS row_count,
    pg_size_pretty(pg_total_relation_size(oid)) AS total_size
FROM pg_stat_user_tables
WHERE relname IN ('products', 'product_images', 'brands', 'categories')
ORDER BY n_live_tup DESC;
" 2>/dev/null
''')
print(out)

print("=" * 60)
print("E. EXPLAIN ANALYZE - YAVAS COUNT SORGUSU")
print("=" * 60)
out, _ = run(client, '''
docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c "
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT count(*)
FROM products p
WHERE p.is_deleted = false
  AND p.is_active = true
LIMIT 1;
" 2>/dev/null
''')
print(out)

print("=" * 60)
print("F. EXPLAIN ANALYZE - VEHICLE FILTER SORGUSU")
print("=" * 60)
out, _ = run(client, '''
docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c "
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name ILIKE ANY(ARRAY['%vehicle%','%arac%','%marka%','%make%','%model%','%brand%'])
ORDER BY column_name;
" 2>/dev/null
''')
print(out)

print("=" * 60)
print("G. PG_STAT_STATEMENTS - EN YAVAS SORGULAR")
print("=" * 60)
out, _ = run(client, '''
docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c "
SELECT
    round(mean_exec_time::numeric, 0) AS mean_ms,
    calls,
    round(total_exec_time::numeric/1000, 1) AS total_sec,
    left(query, 120) AS query_snippet
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
" 2>/dev/null || echo "pg_stat_statements extension yok"
''')
print(out)

print("=" * 60)
print("H. NEXT.JS PAGES force-dynamic DURUMU")
print("=" * 60)
out, _ = run(client, r'''
# customer container icindeki build output'una bakamayiz ama kaynak kodda kontrol edelim
grep -r "force-dynamic\|revalidate\|no-store\|no-cache" /opt/ecom/frontend/customer/src/app/ 2>/dev/null | grep -v ".next" | grep -v "node_modules" | head -30
''')
print(out)

print("=" * 60)
print("I. API LOGS - SON 50 SATIR YAVAS SORGULAR")
print("=" * 60)
out, _ = run(client, 'docker logs --tail 200 ecom-api-1 2>&1 | grep -E "SLOW_QUERY" | tail -20')
print(out)

client.close()
print("\nTamamlandi.")
