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

p("=== Seed env vars from API container ===")
p(run("docker exec ecom-api-1 printenv | grep -i seed"))

p("\n=== JWT secret / settings ===")
p(run("docker exec ecom-api-1 printenv | grep -i 'jwt\\|secret\\|token\\|admin'"))

client.close()
