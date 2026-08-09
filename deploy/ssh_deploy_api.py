# -*- coding: utf-8 -*-
import os, sys, time
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as _f:
        for _line in _f:
            _line = _line.strip()
            if '=' in _line and not _line.startswith('#'):
                _k, _, _v = _line.partition('=')
                if _k.strip() not in os.environ:
                    os.environ[_k.strip()] = _v.strip()

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

print("=== git pull ===")
print(run("cd /opt/ecom && git pull origin main", timeout=60))

print("\n=== docker compose build api ===")
r = run("cd /opt/ecom && docker compose build api 2>&1 | tail -20", timeout=900)
print(r)

print("\n=== docker compose up -d api ===")
r = run("cd /opt/ecom && docker compose up -d api 2>&1", timeout=120)
print(r)

print("\nBekleniyor (40s)...")
time.sleep(40)

print("\n=== Container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=30))

print("\n=== API health ===")
print(run("curl -s http://localhost:15124/health 2>/dev/null | head -c 200", timeout=15))

client.close()
print("\n=== TAMAMLANDI ===")
