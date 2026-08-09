# -*- coding: utf-8 -*-
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if '=' in _line and not _line.startswith('#'):
                _k, _, _v = _line.partition('=')
                if _k.strip() not in os.environ:
                    os.environ[_k.strip()] = _v.strip()

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

# ---- LOCAL DB (psycopg2) ----
try:
    import psycopg2
    local_conn = psycopg2.connect(
        host='127.0.0.1', port=5435, dbname='EcomDb',
        user='ecom', password='ecom_dev_2026'
    )
    cur = local_conn.cursor()

    NO_IMAGE = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

    cur.execute(f"""
        SELECT
          COUNT(*) FILTER (WHERE "ImageUrl" = %s) AS no_image,
          COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%%') AS r2_product,
          COUNT(*) FILTER (WHERE "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%%') AS other_cdn,
          COUNT(*) AS total
        FROM "ProductImages"
        WHERE "IsDeleted" = false;
    """, (NO_IMAGE,))
    row = cur.fetchone()
    print("=== LOCAL DB - ProductImages ===")
    print(f"  no_image   : {row[0]:,}")
    print(f"  r2_product : {row[1]:,}")
    print(f"  other_cdn  : {row[2]:,}")
    print(f"  total      : {row[3]:,}")

    # Records that are NOT no-image on local but WOULD be no-image on server (changed in last 24h)
    # These are candidates for restore
    cur.execute(f"""
        SELECT COUNT(*) FROM "ProductImages"
        WHERE "IsDeleted" = false
          AND "ImageUrl" != %s
          AND "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/products/%%'
    """, (NO_IMAGE,))
    other = cur.fetchone()[0]
    print(f"\n  Diger (external) URL sayisi: {other:,}")

    # Sample of external URLs
    cur.execute(f"""
        SELECT "ImageUrl" FROM "ProductImages"
        WHERE "IsDeleted" = false
          AND "ImageUrl" != %s
          AND "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%%'
        LIMIT 5
    """, (NO_IMAGE,))
    rows = cur.fetchall()
    print("\n  Ornek external URL'ler:")
    for r in rows:
        print(f"    {r[0]}")

    cur.close()
    local_conn.close()
except Exception as e:
    print(f"LOCAL DB HATA: {e}")
    print("psycopg2 yuklu olmayabilir. pip install psycopg2-binary")

print()

# ---- SERVER DB (via SSH) ----
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

NO_IMAGE = 'https://images.autoforcepart.com/static/autoforcepart-no-image.png'

sql = f"""
SELECT
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}') AS no_image,
  COUNT(*) FILTER (WHERE "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%') AS r2_product,
  COUNT(*) FILTER (WHERE "ImageUrl" NOT LIKE 'https://images.autoforcepart.com/%') AS other_cdn,
  COUNT(*) AS total
FROM "ProductImages" WHERE "IsDeleted" = false;

SELECT
  COUNT(*) AS changed_24h,
  COUNT(*) FILTER (WHERE "ImageUrl" = '{NO_IMAGE}') AS changed_to_noimage
FROM "ProductImages"
WHERE "IsDeleted" = false
  AND "UpdatedDate" > NOW() - INTERVAL '24 hours';
"""

sftp = client.open_sftp()
with sftp.open('/tmp/compare_srv.sql', 'w') as f:
    f.write(sql)
sftp.close()

print("=== SERVER DB - ProductImages ===")
print(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/compare_srv.sql", timeout=60))

client.close()
