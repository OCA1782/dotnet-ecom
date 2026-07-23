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

# .env'den NEXT_PUBLIC_API_URL oku
api_url_raw = run("grep '^NEXT_PUBLIC_API_URL=' /opt/ecom/.env | cut -d= -f2-")
api_url = api_url_raw.strip()
print(f"=== NEXT_PUBLIC_API_URL: {api_url} ===")

# Mevcut admin container'inin network ve env bilgilerini al
print("\n=== Mevcut admin container network ===")
print(run("docker inspect ecom-admin-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'"))

print("\n=== docker build admin ===")
build_cmd = (
    f"cd /opt/ecom && docker build "
    f"--build-arg NEXT_PUBLIC_API_URL={api_url} "
    f"-t ecom-admin-new:latest "
    f"-f frontend/admin/Dockerfile "
    f"frontend/admin 2>&1 | tail -20"
)
r = run(build_cmd, timeout=900)
print(r)

print("\n=== admin container yeniden baslatiliyor ===")
print(run("docker stop ecom-admin-1 && docker rm ecom-admin-1", timeout=30))

# Calistir
host_ip = run("grep DOCKER_HOST_IP /opt/ecom/.env | cut -d= -f2- || echo '127.0.0.1'").strip() or "127.0.0.1"
network_name = run("docker inspect ecom-api-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'").strip()
print(f"Network: {network_name}, Host IP: {host_ip}")

run_cmd = (
    f"docker run -d --name ecom-admin-1 "
    f"--network {network_name} "
    f"-p {host_ip}:13001:3001 "
    f"-e NEXT_PUBLIC_API_URL={api_url} "
    f"-e PORT=3001 "
    f"-e INTERNAL_API_URL=http://ecom-api-1:8080 "
    f"--restart unless-stopped "
    f"ecom-admin-new:latest"
)
print(f"\n=== docker run: {run_cmd} ===")
print(run(run_cmd, timeout=30))

print("\n=== Container durumu ===")
print(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=30))

client.close()
print("\n=== TAMAMLANDI ===")
