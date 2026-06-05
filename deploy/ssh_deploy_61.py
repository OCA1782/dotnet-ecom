# -*- coding: utf-8 -*-
import sys, os, base64
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=== git pull ===")
print(run("cd /opt/ecom && git pull origin main", timeout=60))

print("\n=== docker compose build api ===")
print(run("cd /opt/ecom && docker compose build --no-cache api 2>&1 | tail -20", timeout=600))

print("\n=== docker compose build admin ===")
print(run("cd /opt/ecom && docker compose build --no-cache admin 2>&1 | tail -20", timeout=600))

print("\n=== restart api + admin ===")
print(run("cd /opt/ecom && docker compose up -d --no-deps api admin 2>&1", timeout=60))

print("\n=== Migration API restart sirasinda otomatik uygulanir ===")

print("\n=== container durumu ===")
print(run("docker ps --format 'table {{.Names}}\\t{{.Status}}'"))

client.close()
print("\n=== DEPLOY TAMAM ===")
