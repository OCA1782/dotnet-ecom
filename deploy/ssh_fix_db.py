# -*- coding: utf-8 -*-
import os
import paramiko
import time

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

print("=== API container durdur ===")
print(run("docker stop ecom-api-1"))

print("\n=== EcomDb sil ve yeniden olustur ===")
drop_cmd = """docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'REDACTED_SA_PASSWORD' -C \
  -Q "IF EXISTS (SELECT name FROM sys.databases WHERE name='EcomDb') DROP DATABASE EcomDb; CREATE DATABASE EcomDb;" """
print(run(drop_cmd, timeout=30))

print("\n=== DB olusturuldu, API yeniden baslat ===")
print(run("docker start ecom-api-1"))

print("\n=== 20sn bekle ===")
time.sleep(20)

print("\n=== API durum ===")
print(run("docker ps --filter name=ecom-api-1 --format '{{.Status}}'"))

print("\n=== API son loglar ===")
print(run("docker logs ecom-api-1 --tail 30 2>&1"))

client.close()
