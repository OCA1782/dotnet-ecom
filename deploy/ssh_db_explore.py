# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=20):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

p("=== Databases ===")
p(run('docker exec ecom-postgres-1 psql -U postgres -l 2>/dev/null'))

p("\n=== Tables in EcomDb ===")
p(run('docker exec ecom-postgres-1 psql -U postgres -d EcomDb -c "SELECT tablename FROM pg_tables WHERE schemaname=\'public\' ORDER BY tablename;" 2>/dev/null'))

p("\n=== Check postgres user ===")
p(run('docker exec ecom-postgres-1 env | grep POSTGRES'))

client.close()
p("\nDone.")
