# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def psql(sql, timeout=20):
    cmd = f'docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c "{sql}" 2>&1'
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

p("=== Tables ===")
p(psql("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"))

p("\n=== SiteSettings sample ===")
p(psql("SELECT * FROM \\\"SiteSettings\\\" LIMIT 5;"))

p("\n=== SiteUrl / SiteLink related keys ===")
p(psql("SELECT \\\"Key\\\", \\\"Value\\\" FROM \\\"SiteSettings\\\" WHERE \\\"Key\\\" ILIKE '%site%' OR \\\"Key\\\" ILIKE '%url%' OR \\\"Key\\\" ILIKE '%name%' LIMIT 20;"))

client.close()
p("\nDone.")
