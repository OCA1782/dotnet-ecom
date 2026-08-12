# -*- coding: utf-8 -*-
import sys, psycopg2
sys.stdout.reconfigure(encoding='utf-8')

ecom = psycopg2.connect(host='127.0.0.1', port=5435, dbname='EcomDb', user='ecom', password='ecom_dev_2026')
cur = ecom.cursor()
cur.execute("""SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename='Products' AND schemaname='public'""")
print('Products indexes:')
for r in cur.fetchall():
    print(f'  {r[0]}')
cur.close(); ecom.close()

print()

ciq = psycopg2.connect(host='127.0.0.1', port=5436, dbname='catalogiq', user='catalogiq', password='catalogiq123')
cur2 = ciq.cursor()

# Faster: LEFT JOIN approach
cur2.execute("""
    SELECT COUNT(DISTINCT normalized_product_id) FROM migration_log_local
""")
print(f'migration_log_local unique IDs: {cur2.fetchone()[0]:,}')

# Count NOT migrated using LEFT JOIN (faster than NOT IN for large sets)
cur2.execute("""
    SELECT COUNT(*) FROM "NormalizedProducts" np
    LEFT JOIN migration_log_local ml ON ml.normalized_product_id = np."Id"
    WHERE np."IsDeleted" = false
      AND ml.normalized_product_id IS NULL
""")
print(f'Aktarilmamis NormalizedProduct: {cur2.fetchone()[0]:,}')

cur2.close(); ciq.close()
