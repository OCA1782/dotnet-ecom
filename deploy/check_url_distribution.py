# -*- coding: utf-8 -*-
import os, sys, io, paramiko
sys.stdout.reconfigure(encoding='utf-8')

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(_env, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.environ['DEPLOY_SSH_HOST'],
            username=os.environ['DEPLOY_SSH_USER'],
            password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run(cmd, timeout=90):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

def run_sql(sql, timeout=120):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/tmp/_q.sql')
    sftp.close()
    return run('docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/_q.sql', timeout=timeout)

print('=== ProductImages URL dagilimi ===')
sql = r"""
SELECT
  CASE
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%' THEN 'R2-products'
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/static/%'   THEN 'static'
    WHEN "ImageUrl" LIKE '%pub-%.r2.dev%'                               THEN 'R2-pub-url'
    WHEN "ImageUrl" LIKE '%onlineyedekparca%'                           THEN 'OYP'
    WHEN "ImageUrl" IS NULL OR "ImageUrl" = ''                          THEN 'bos'
    WHEN "ImageUrl" LIKE 'http%'                                        THEN 'other-external'
    ELSE 'diger'
  END AS tip,
  COUNT(*) AS adet
FROM "ProductImages"
WHERE "IsDeleted" = false
GROUP BY 1
ORDER BY adet DESC;
"""
print(run_sql(sql))

print('\n=== Tablolar (migration ile ilgili) ===')
sql2 = r"""
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%migrat%' OR table_name ILIKE '%log%')
ORDER BY table_name;
"""
print(run_sql(sql2))

print('\n=== Toplam ProductImages (aktif) ===')
sql3 = r'SELECT COUNT(*) FROM "ProductImages" WHERE "IsDeleted" = false;'
print(run_sql(sql3))

ssh.close()
