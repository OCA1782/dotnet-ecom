# -*- coding: utf-8 -*-
import paramiko
import sys

host = '178.105.230.111'
user = 'root'
password = 'REDACTED_SSH_PASSWORD'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)
print("=== BAGLANTI OK ===", flush=True)

def run(cmd, timeout=180):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("\n=== Repo clone ===")
r = run("rm -rf /opt/ecom && git clone https://github.com/OCA1782/dotnet-ecom /opt/ecom && echo 'CLONE_OK'", timeout=120)
print(r[-500:])

print("\n=== Dizin yapisi ===")
print(run("ls /opt/ecom"))

client.close()
print("\n=== CLONE TAMAM ===")
