# -*- coding: utf-8 -*-
"""Prod sunucu: .env oku, ürün sayısını DB'den sorgula, kaynak listesini al"""
import os, sys, json, urllib.request, urllib.error
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_env):
    with open(_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

HOST = os.environ['DEPLOY_SSH_HOST']
USER = os.environ['DEPLOY_SSH_USER']
PASS = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"SSH bağlantısı: {HOST}")
client.connect(HOST, username=USER, password=PASS, timeout=20)

def run(cmd, timeout=30):
    _, out, err = client.exec_command(cmd, timeout=timeout)
    return (out.read().decode('utf-8', errors='replace') + err.read().decode('utf-8', errors='replace')).strip()

# Read prod .env
print("\n=== Prod .env (admin/pass) ===")
env_vals = run("grep -E 'SEED_ADMIN|SA_PASSWORD|JWT_KEY' /opt/ecom/.env 2>/dev/null | head -5")
print(env_vals)

# DB: product counts
print("\n=== Ürün sayısı (DB) ===")
sa_pass = run("grep SA_PASSWORD /opt/ecom/.env | cut -d= -f2-")
sql_out = run(f"""docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P '{sa_pass}' -C -Q \
  "SELECT 'Aktif' as Durum, COUNT(*) as Sayi FROM Products WHERE IsDeleted=0
   UNION ALL
   SELECT 'Silinmis', COUNT(*) FROM Products WHERE IsDeleted=1
   UNION ALL
   SELECT 'Toplam', COUNT(*) FROM Products" 2>&1""", timeout=30)
print(sql_out)

# List running containers
print("\n=== Docker containers ===")
print(run("docker ps --format '{{.Names}}: {{.Status}}'", timeout=15))

client.close()
