# -*- coding: utf-8 -*-
"""
Verify: Check if any image URLs in DB still point to local server (api.autoforcepart.com)
If any remain, the local file deletion could break those images.
"""
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

# Write SQL file to check for local image URLs
sql = '''
SELECT
  'ProductImages' as tablo,
  COUNT(*) as lokal_url_sayisi
FROM "ProductImages"
WHERE "ImageUrl" LIKE '%api.autoforcepart.com%'
  AND "IsDeleted" = false
UNION ALL
SELECT 'Users', COUNT(*) FROM "Users"
WHERE "AvatarUrl" LIKE '%api.autoforcepart.com%'
  AND "IsDeleted" = false
UNION ALL
SELECT 'Categories', COUNT(*) FROM "Categories"
WHERE "ImageUrl" LIKE '%api.autoforcepart.com%'
  AND "IsDeleted" = false
UNION ALL
SELECT 'Brands', COUNT(*) FROM "Brands"
WHERE "LogoUrl" LIKE '%api.autoforcepart.com%'
  AND "IsDeleted" = false;
'''

p("=== Writing check SQL to container ===")
p(run(f"docker exec ecom-postgres-1 sh -c 'cat > /tmp/check_urls.sql << HEREDOC\n{sql}\nHEREDOC'"))
p(run("docker exec ecom-postgres-1 sh -c 'echo \"%s\" > /tmp/check_urls.sql'" % sql.replace('"', '\\"').replace('\n', '\\n')))

# Actually use a simpler approach - write via stdin
sftp = client.open_sftp()
with sftp.open('/tmp/check_urls.sql', 'w') as f:
    f.write(sql)
sftp.close()

p("=== Copying SQL to container ===")
p(run("docker cp /tmp/check_urls.sql ecom-postgres-1:/tmp/check_urls.sql"))

p("\n=== Checking for local image URLs in DB ===")
result = run("docker exec ecom-postgres-1 psql -U ecom -d ecom -f /tmp/check_urls.sql 2>&1")
p(result)

client.close()
p("\n=== DONE ===")
