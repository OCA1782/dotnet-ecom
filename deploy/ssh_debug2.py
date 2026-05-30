# -*- coding: utf-8 -*-
import paramiko

host = '178.105.230.111'
user = 'root'
password = 'REDACTED_SSH_PASSWORD'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=900):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=== customer build full output (son 80 satir) ===")
r = run("cd /opt/ecom && docker compose build --no-cache --progress=plain customer 2>&1 | tail -80", timeout=900)
print(r)

client.close()
