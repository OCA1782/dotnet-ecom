# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=== git pull ===")
print(run("cd /opt/ecom && git pull origin main", timeout=60))

print("\n=== docker compose build admin ===")
r = run("cd /opt/ecom && docker compose build admin 2>&1 | tail -30", timeout=900)
print(r)

print("\n=== docker compose up -d admin ===")
r = run("cd /opt/ecom && docker compose up -d admin 2>&1", timeout=60)
print(r)

print("\n=== Container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=30))

client.close()
print("\n=== TAMAMLANDI ===")
