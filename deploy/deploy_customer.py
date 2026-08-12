# -*- coding: utf-8 -*-
"""
Production customer deployment script.
Usage: DEPLOY_SSH_PASSWORD=<pass> python deploy/deploy_customer.py
"""
import os
import sys
import paramiko

password = os.environ.get('DEPLOY_SSH_PASSWORD')
if not password:
    print("ERROR: DEPLOY_SSH_PASSWORD environment variable not set.")
    print("Usage: DEPLOY_SSH_PASSWORD=<pass> python deploy/deploy_customer.py")
    sys.exit(1)

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("Connecting to production server...")
client.connect('31.210.40.242', username='bilgi', password=password, timeout=15)

def run(cmd, timeout=120):
    print(f"\n$ {cmd}")
    _, o, e = client.exec_command(cmd, timeout=timeout)
    out = (o.read() + e.read()).decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    return out

print("Connected.\n")

run("cd /opt/ecom && git pull origin main")
run("cd /opt/ecom && docker compose build customer", timeout=600)
run("cd /opt/ecom && docker compose up -d customer", timeout=60)
run("docker ps --format 'table {{.Names}}\t{{.Status}}' | grep customer")

client.close()
print("\nDeploy complete.")
