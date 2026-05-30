# -*- coding: utf-8 -*-
import paramiko
import time

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

print("=== 10sn bekle (API health) ===")
time.sleep(10)

print("\n=== Container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}'"))

print("\n=== API health check ===")
print(run("curl -s -o /dev/null -w '%{http_code}' http://localhost:5124/health || echo 'HATA'"))

print("\n=== API swagger ===")
print(run("curl -s -o /dev/null -w '%{http_code}' http://localhost:5124/swagger || echo 'HATA'"))

print("\n=== Customer port ===")
print(run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'HATA'"))

print("\n=== Admin port ===")
print(run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001 || echo 'HATA'"))

print("\n=== API son loglar ===")
print(run("docker logs ecom-api-1 --tail 20 2>&1"))

client.close()
