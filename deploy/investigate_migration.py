# -*- coding: utf-8 -*-
import os, sys, paramiko
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

def run(cmd, timeout=60):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

print('=== Calisacak PID 2105235 - ne o? ===')
print(run('cat /proc/2105235/cmdline 2>/dev/null | tr "\\0" " " || echo "BULUNAMADI"'))

print('\n=== /tmp altindaki python scriptler ===')
print(run('ls -lh /tmp/*.py 2>/dev/null || echo YOK'))

print('\n=== Tum caliscan python process leri ===')
print(run('pgrep -a python3'))

print('\n=== ProductImages - URL dagilimi (guncel) ===')
sql = """
SELECT
  CASE
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/products/%' THEN 'R2-products'
    WHEN "ImageUrl" LIKE 'https://images.autoforcepart.com/static/%' THEN 'static'
    WHEN "ImageUrl" LIKE 'https://pub-%' THEN 'R2-pub-url'
    WHEN "ImageUrl" LIKE '%onlineyedekparca%' THEN 'OYP'
    WHEN "ImageUrl" LIKE 'http%' THEN 'other-external'
    WHEN "ImageUrl" IS NULL OR "ImageUrl" = '' THEN 'bos'
    ELSE 'diger'
  END AS tip,
  COUNT(*) AS adet
FROM "ProductImages"
WHERE "IsDeleted" = false
GROUP BY 1
ORDER BY adet DESC;
"""
print('\n=== ProductImages URL dagilimi ===')
print(run(f"""docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -c '{sql}'""", timeout=90))

print('\n=== ImageMigrationLog tablosu var mi? ===')
print(run("""docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ImageMigrationLog');" """, timeout=30))

print('\n=== /tmp log dosyalari ===')
print(run('ls -lh /tmp/*.log /tmp/*.txt 2>/dev/null'))

ssh.close()
