# -*- coding: utf-8 -*-
import paramiko
import time

host = '178.105.230.111'
user = 'root'
password = 'REDACTED_SSH_PASSWORD'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=== Dockerfile'lar kontrol ===")
print("-- backend --")
print(run("cat /opt/ecom/backend/Dockerfile"))
print("\n-- frontend/admin --")
print(run("cat /opt/ecom/frontend/admin/Dockerfile"))
print("\n-- frontend/customer --")
print(run("cat /opt/ecom/frontend/customer/Dockerfile"))

client.close()
