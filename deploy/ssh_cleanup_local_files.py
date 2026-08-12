# -*- coding: utf-8 -*-
"""
Delete locally stored image files from the server after R2 migration.
All uploads now go to R2 - the local uploads volume should be empty.
"""
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run(cmd, timeout=30):
    _, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', errors='replace').strip()

def p(t):
    print(t.encode('ascii', errors='replace').decode('ascii'))

p("=== Local uploads BEFORE cleanup ===")
p(run("docker exec ecom-api-1 find /app/wwwroot/uploads -type f 2>/dev/null"))

p("\n=== Deleting all local upload files ===")
p(run("docker exec ecom-api-1 find /app/wwwroot/uploads -type f -delete 2>&1 && echo 'OK: All local files deleted'"))

p("\n=== Local uploads AFTER cleanup ===")
p(run("docker exec ecom-api-1 find /app/wwwroot/uploads -type f 2>/dev/null | wc -l"))
p(run("docker exec ecom-api-1 ls /app/wwwroot/uploads/ 2>/dev/null || echo '(directory now empty)'"))

client.close()
p("\n=== DONE ===")
