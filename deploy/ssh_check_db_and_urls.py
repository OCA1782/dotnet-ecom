# -*- coding: utf-8 -*-
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

# Find DB connection string
p("=== DB connection from API env ===")
p(run("docker exec ecom-api-1 printenv | grep -i Connection"))

# Find postgres user/db
p("\n=== Postgres container check ===")
p(run("docker exec ecom-postgres-1 psql --version"))
p(run("docker exec ecom-postgres-1 sh -c 'psql -U ecomuser -d ecomdb -l 2>&1 | head -5' || docker exec ecom-postgres-1 sh -c 'psql -c \"\\l\" 2>&1 | head -10'"))

# Try to find the right user/db from compose
p("\n=== Docker compose env for postgres ===")
p(run("cd /opt/ecom && docker compose config 2>&1 | grep -A5 'postgres'"))

client.close()
p("\n=== DONE ===")
