# -*- coding: utf-8 -*-
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run(cmd, timeout=60):
    _, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', errors='replace').strip()

def p(t):
    print(t.encode('ascii', errors='replace').decode('ascii'))

sql = """
SELECT 'ProductImages' as tbl, COUNT(*) as local_count
FROM "ProductImages"
WHERE "ImageUrl" LIKE '%api.autoforcepart.com%' AND "IsDeleted" = false
UNION ALL
SELECT 'Users', COUNT(*) FROM "Users"
WHERE "AvatarUrl" LIKE '%api.autoforcepart.com%' AND "IsDeleted" = false
UNION ALL
SELECT 'Categories', COUNT(*) FROM "Categories"
WHERE "ImageUrl" LIKE '%api.autoforcepart.com%' AND "IsDeleted" = false
UNION ALL
SELECT 'Brands', COUNT(*) FROM "Brands"
WHERE "LogoUrl" LIKE '%api.autoforcepart.com%' AND "IsDeleted" = false;
"""

# Write SQL to host
sftp = client.open_sftp()
with sftp.open('/tmp/check_local_urls.sql', 'w') as f:
    f.write(sql)
sftp.close()

p("=== Checking for local-server image URLs in DB ===")
p(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/check_local_urls.sql 2>&1"))

client.close()
p("\n=== DONE ===")
