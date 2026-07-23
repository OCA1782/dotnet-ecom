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

print("=== postgres logs ===")
print(run("docker logs ecom-postgres-1 --tail 30 2>&1", timeout=15))

print("\n=== postgres inspect ===")
print(run("docker inspect ecom-postgres-1 --format '{{.State.Status}} | ExitCode: {{.State.ExitCode}}'"))

print("\n=== .env POSTGRES degerleri (gizli) ===")
print(run("grep POSTGRES /opt/ecom/.env | sed 's/=.*/=***/'"))

# docker-compose postgres healthcheck komutunu kontrol et
print("\n=== healthcheck komutu ===")
print(run("docker inspect ecom-postgres-1 --format '{{range .Config.Healthcheck.Test}}{{.}} {{end}}'"))

client.close()
