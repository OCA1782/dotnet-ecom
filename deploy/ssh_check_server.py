# -*- coding: utf-8 -*-
import os
import paramiko

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

print("=== /opt/ecom dosyalari ===")
print(run("ls /opt/ecom/"))

print("\n=== .env dosyasi var mi? ===")
print(run("ls -la /opt/ecom/.env* 2>/dev/null || echo 'YOK'"))

print("\n=== docker-compose.yml (ilk 40 satir) ===")
print(run("head -40 /opt/ecom/docker-compose.yml"))

print("\n=== admin image mevcut mu? ===")
print(run("docker images | grep admin"))

print("\n=== admin container detayi ===")
print(run("docker inspect ecom-admin-1 --format '{{.Config.Image}} | Started: {{.State.StartedAt}}'"))

client.close()
