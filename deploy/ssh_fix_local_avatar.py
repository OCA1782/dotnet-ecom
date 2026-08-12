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

# First, see who has the local avatar
sql_find = """
SELECT "Id", "Email", "AvatarUrl"
FROM "Users"
WHERE "AvatarUrl" LIKE '%api.autoforcepart.com%' AND "IsDeleted" = false;
"""

sftp = client.open_sftp()
with sftp.open('/tmp/find_local_avatar.sql', 'w') as f:
    f.write(sql_find)

sql_clear = """
UPDATE "Users"
SET "AvatarUrl" = NULL
WHERE "AvatarUrl" LIKE '%api.autoforcepart.com%' AND "IsDeleted" = false;
"""
with sftp.open('/tmp/clear_local_avatar.sql', 'w') as f:
    f.write(sql_clear)
sftp.close()

p("=== User with local avatar ===")
p(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/find_local_avatar.sql 2>&1"))

p("\n=== Clearing local avatar URL ===")
p(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/clear_local_avatar.sql 2>&1"))

p("\n=== Verify cleared ===")
p(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -c \"SELECT COUNT(*) FROM \\\"Users\\\" WHERE \\\"AvatarUrl\\\" LIKE '%api.autoforcepart.com%' AND \\\"IsDeleted\\\" = false\" 2>&1"))

client.close()
p("\n=== DONE ===")
