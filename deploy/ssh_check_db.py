# -*- coding: utf-8 -*-
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=== ecom-db-1 image ===")
print(run("docker inspect ecom-db-1 --format '{{.Config.Image}}'"))

print("\n=== ecom-db-1 environment (gizli) ===")
print(run("docker inspect ecom-db-1 --format '{{range .Config.Env}}{{.}}\n{{end}}' | sed 's/=.*/=***/'"))

print("\n=== API health durumu ===")
import time
time.sleep(10)
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=30))

print("\n=== API logs (son 20 satir) ===")
print(run("docker logs ecom-api-1 --tail 20 2>&1", timeout=15))

print("\n=== Sunucuda acik portlar ===")
print(run("ss -tlnp | grep -E '5432|1433|13001|15124'"))

client.close()
