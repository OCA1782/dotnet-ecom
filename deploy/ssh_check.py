# -*- coding: utf-8 -*-
import paramiko

host = '178.105.230.111'
user = 'root'
password = 'REDACTED_SSH_PASSWORD'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=== docker-compose.yml ===")
print(run("cat /opt/ecom/docker-compose.yml"))

print("\n=== backend Dockerfile var mi? ===")
print(run("ls /opt/ecom/backend/"))

print("\n=== frontend/admin Dockerfile var mi? ===")
print(run("ls /opt/ecom/frontend/admin/"))

print("\n=== frontend/customer Dockerfile var mi? ===")
print(run("ls /opt/ecom/frontend/customer/"))

client.close()
