# -*- coding: utf-8 -*-
import os, sys
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

conn = psycopg2.connect(host='127.0.0.1', port=5435, dbname='EcomDb', user='ecom', password='ecom_dev_2026')
cur = conn.cursor()

for t in ['ExternalSources', 'ExternalSourceImportLogs', 'ImportJobs']:
    cur.execute(f"""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='{t}'
        ORDER BY ordinal_position;
    """)
    print(f'=== {t} ===')
    for r in cur.fetchall():
        print(f'  {r[0]:<35} {r[1]}')
    cur.execute(f'SELECT * FROM "{t}" LIMIT 2')
    cols = [desc[0] for desc in cur.description]
    for row in cur.fetchall():
        print(f'  ROW:')
        for c, v in zip(cols, row):
            val = str(v)[:80] if v is not None else 'NULL'
            print(f'    {c:<35}: {val}')
    print()

cur.close()
conn.close()
