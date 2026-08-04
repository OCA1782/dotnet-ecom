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

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

p("=== API container - port 8080 listening? ===")
p(run("docker exec ecom-api-1 sh -c 'ss -tlnp | grep 8080 || netstat -tlnp | grep 8080'"))

p("\n=== Customer -> API via container name ===")
p(run("docker exec ecom-customer-1 sh -c 'wget -qO- --timeout=5 http://ecom-api-1:8080/health 2>&1 | head -5 || echo FAIL'"))

p("\n=== Customer -> API via IP ===")
p(run("docker exec ecom-customer-1 sh -c 'wget -qO- --timeout=5 http://172.18.0.6:8080/health 2>&1 | head -5 || echo FAIL'"))

p("\n=== API health endpoint from host ===")
p(run("curl -s http://127.0.0.1:15124/health --max-time 5"))

p("\n=== Docker network inspect ===")
p(run("docker network ls | grep ecom"))

p("\n=== API in ecom network? ===")
p(run("docker network inspect ecom_default 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); [print(c['Name'],c['IPv4Address']) for c in d[0]['Containers'].values()]\" 2>/dev/null || docker network inspect ecom_ecom_default 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); [print(c['Name'],c['IPv4Address']) for c in d[0]['Containers'].values()]\" 2>/dev/null || echo 'network inspect failed'"))

client.close()
p("\nDone.")
