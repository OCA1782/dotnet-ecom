# -*- coding: utf-8 -*-
"""
1. Check API error logs for upload failures
2. List and delete locally stored image files (BulutX cleanup)
3. Verify R2 environment variables are set
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

# 1. Check R2 env vars in the API container
p("=== R2 environment variables (API container) ===")
p(run("docker exec ecom-api-1 printenv | grep -i 'R2\\|r2\\|storage\\|bucket' 2>&1 || echo 'container not found'"))

# 2. Check recent API error logs for upload failures
p("\n=== Recent API logs (errors, last 100 lines) ===")
p(run("docker logs ecom-api-1 --tail=100 2>&1 | grep -i 'error\\|exception\\|upload\\|r2\\|s3\\|500' | head -30"))

# 3. Find local image files in the API container
p("\n=== Local uploads in API container ===")
p(run("docker exec ecom-api-1 find /app/wwwroot/uploads -type f 2>/dev/null | wc -l || echo 'uploads dir not found'"))
p(run("docker exec ecom-api-1 ls /app/wwwroot/uploads/ 2>/dev/null | head -5 || echo 'dir empty or not found'"))

# 4. Also check common mount paths on host
p("\n=== Host mounted upload paths ===")
p(run("find /opt/ecom -name 'uploads' -type d 2>/dev/null"))
p(run("ls /opt/ecom/uploads/ 2>/dev/null | head -5 || echo 'not found'"))

# 5. Check docker compose for volume mounts
p("\n=== API volume mounts ===")
p(run("docker inspect ecom-api-1 --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}\n{{end}}' 2>&1 | head -20"))

client.close()
p("\n=== DONE ===")
