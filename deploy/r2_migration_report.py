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
ssh.connect(os.environ['DEPLOY_SSH_HOST'], username=os.environ['DEPLOY_SSH_USER'],
            password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run_sql(sql, timeout=120):
    sftp = ssh.open_sftp()
    sftp.putfo(io.BytesIO(sql.encode('utf-8')), '/tmp/_report.sql')
    sftp.close()
    _, out, err = ssh.exec_command(
        'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/_report.sql',
        timeout=timeout
    )
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

def run(cmd, timeout=30):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

# 1. ImageMigrationLog ozet
print('=== [1] Migration Log — Genel Ozet ===')
sql = r"""
SELECT
  "Status",
  COUNT(*) AS adet
FROM "ImageMigrationLog"
GROUP BY "Status"
ORDER BY adet DESC;
"""
print(run_sql(sql))

# 2. success kayitlarin kaynak dagilimi
print('\n=== [2] R2ye Yuklenen (success) — Kaynak URL Dagilimi ===')
sql = r"""
SELECT
  CASE
    WHEN "OldImageUrl" LIKE '%onlineyedekparca%' THEN 'OYP'
    WHEN "OldImageUrl" LIKE 'http%'              THEN 'Diger External'
    ELSE 'Diger'
  END AS kaynak,
  COUNT(*) AS adet
FROM "ImageMigrationLog"
WHERE "Status" = 'success'
GROUP BY 1
ORDER BY adet DESC;
"""
print(run_sql(sql))

# 3. failed kayitlarin kaynak dagilimi
print('\n=== [3] Basarisiz (failed) — Kaynak URL Dagilimi ===')
sql = r"""
SELECT
  CASE
    WHEN "OldImageUrl" LIKE '%onlineyedekparca%' THEN 'OYP'
    WHEN "OldImageUrl" LIKE 'http%'              THEN 'Diger External'
    ELSE 'Diger'
  END AS kaynak,
  COUNT(*) AS adet,
  MIN("ErrorMessage") AS ornek_hata
FROM "ImageMigrationLog"
WHERE "Status" = 'failed'
GROUP BY 1
ORDER BY adet DESC;
"""
print(run_sql(sql))

# 4. Guncel ProductImages URL dagilimi
print('\n=== [4] Guncel ProductImages URL Dagilimi (DB) ===')
sql = r"""
SELECT
  CASE
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%' THEN 'R2-products (aktif)'
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/static/%'   THEN 'Static CDN'
    WHEN "ImageUrl" LIKE '%onlineyedekparca%'                           THEN 'OYP (islenmedi/kalan)'
    WHEN "ImageUrl" IS NULL OR "ImageUrl" = ''                          THEN 'NULL/Bos'
    WHEN "ImageUrl" LIKE 'http%'                                        THEN 'Diger External (kalan)'
    ELSE 'Diger'
  END AS tip,
  COUNT(*) AS adet
FROM "ProductImages"
WHERE "IsDeleted" = false
GROUP BY 1
ORDER BY adet DESC;
"""
print(run_sql(sql))

# 5. Worker durumu
print('\n=== [5] Worker Durumu ===')
pid = run("ps aux | grep '[r]2_fresh_worker.py' | awk '{print $2}'")
if pid:
    print(f'CALISIYOR (PID={pid})')
    print(run('cat /tmp/r2_fresh_progress.txt 2>/dev/null'))
else:
    print('DURDU / TAMAMLANDI')
    print(run('tail -5 /tmp/r2_fresh_migration.log 2>/dev/null'))

ssh.close()
