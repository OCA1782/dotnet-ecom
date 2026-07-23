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

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print("=== git pull ===")
print(run("cd /opt/ecom && git pull origin main", timeout=60))

print("\n=== Mevcut API container env anahtarlari ===")
# Sadece ConnectionStrings anahtarlarini goster (degerler gizli)
env_keys = run("docker inspect ecom-api-1 --format '{{range .Config.Env}}{{.}}\n{{end}}' | grep -i 'Connection\\|Database\\|Provider' | sed 's/=.*/=***/'")
print(env_keys)

print("\n=== docker build api ===")
build_cmd = (
    "cd /opt/ecom && docker build "
    "-t ecom-api-new:latest "
    "-f backend/Dockerfile "
    "backend 2>&1 | tail -20"
)
r = run(build_cmd, timeout=900)
print(r)

print("\n=== Mevcut API container run komutunu al ===")
api_env = run("docker inspect ecom-api-1 --format '{{range .Config.Env}}{{.}} {{end}}'")

print("\n=== API container yeniden baslatiliyor ===")
# Mevcut container'i durdur ve kaldır
print(run("docker stop ecom-api-1 && docker rm ecom-api-1", timeout=30))

# ENV'leri topla
env_list = [e for e in api_env.strip().split(' ') if '=' in e and not e.startswith('PATH=') and not e.startswith('APP_UID=') and not e.startswith('ASPNETCORE_HTTP_PORTS=') and not e.startswith('DOTNET_')]
env_flags = ' '.join(f'-e "{e}"' for e in env_list)

# Network bul
network_name = run("docker inspect ecom-rabbitmq-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'").strip()
host_ip = run("grep DOCKER_HOST_IP /opt/ecom/.env | cut -d= -f2- || echo '127.0.0.1'").strip() or "127.0.0.1"

run_cmd = (
    f"docker run -d --name ecom-api-1 "
    f"--network {network_name} "
    f"-p {host_ip}:15124:8080 "
    f"-v uploads:/app/wwwroot/uploads "
    f"-v docs:/app/docs "
    f"-v /opt/ecom/.git:/app/.git:ro "
    f"--add-host host.docker.internal:host-gateway "
    f"--restart unless-stopped "
    f"{env_flags} "
    f"ecom-api-new:latest"
)
print(f"\nRun cmd: {run_cmd[:200]}...")
result = run(run_cmd, timeout=30)
print(f"Result: {result}")

import time
print("\nBekleniyor (15s)...")
time.sleep(15)

print("\n=== Container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=30))

print("\n=== API health ===")
print(run("curl -s http://localhost:15124/health 2>/dev/null | head -c 200", timeout=15))

client.close()
print("\n=== TAMAMLANDI ===")
