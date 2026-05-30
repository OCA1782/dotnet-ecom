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

# Docker GPG key ve repo ekle
print("\n=== Docker repo ekleniyor ===")
cmds = [
    "install -m 0755 -d /etc/apt/keyrings",
    "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg",
    "chmod a+r /etc/apt/keyrings/docker.gpg",
    'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null',
]
for c in cmds:
    r = run(c)
    if r:
        print(r[-200:])

print("\n=== apt update (docker repo) ===")
print(run("apt-get update -qq && echo 'UPDATE_OK'"))

print("\n=== Docker kurulumu ===")
r = run("apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin && echo 'DOCKER_OK'", timeout=300)
print(r[-400:])

print("\n=== Docker versiyonu ===")
print(run("docker --version && docker compose version"))

print("\n=== Docker servisi baslat ===")
print(run("systemctl enable docker && systemctl start docker && echo 'SERVICE_OK'"))

print("\n=== Firewall ayarla ===")
fw_cmds = [
    "ufw allow ssh",
    "ufw allow 3000/tcp",
    "ufw allow 3001/tcp",
    "ufw allow 5124/tcp",
    "ufw --force enable",
    "ufw status",
]
for c in fw_cmds:
    print(run(c))

client.close()
print("\n=== DOCKER KURULUMU TAMAM ===")
