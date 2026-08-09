# -*- coding: utf-8 -*-
import sys, psycopg2
sys.stdout.reconfigure(encoding='utf-8')

CIQ_DSN = "host=127.0.0.1 port=5436 dbname=catalogiq user=catalogiq password=catalogiq123"
conn = psycopg2.connect(CIQ_DSN)
cur = conn.cursor()

for t in ['NormalizedProducts', 'ProductMediaAssets', 'IntegrationTargets', 'IntegrationJobs', 'migration_log_bulutx', 'migration_log_local']:
    cur.execute(f"""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='{t}'
        ORDER BY ordinal_position
    """)
    cols = cur.fetchall()
    if not cols:
        print(f'=== {t} === (tablo yok veya bos)\n')
        continue
    print(f'=== {t} ===')
    for c, dt in cols:
        print(f'  {c:<40} {dt}')

    # Sample rows
    cur.execute(f'SELECT * FROM "{t}" LIMIT 2')
    rows = cur.fetchall()
    col_names = [desc[0] for desc in cur.description]
    for row in rows:
        print(f'  --- SATIR ---')
        for cn, v in zip(col_names, row):
            val = str(v)[:100] if v is not None else 'NULL'
            print(f'    {cn:<40}: {val}')
    print()

cur.close()
conn.close()
