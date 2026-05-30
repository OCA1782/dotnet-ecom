# -*- coding: utf-8 -*-
import paramiko
import sys

host = '178.105.230.111'
user = 'root'
password = 'REDACTED_SSH_PASSWORD'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(host, username=user, password=password, timeout=15)
    print("=== BAGLANTI OK ===", flush=True)
except Exception as e:
    print(f"BAGLANTI HATASI: {e}", flush=True)
    sys.exit(1)

def run(cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

print(run("echo 'TEST_OK' && uname -a"))

print("\n=== apt update ===")
r = run("apt-get update -qq && echo 'UPDATE_OK'", timeout=120)
print(r[-300:])

print("\n=== apt upgrade ===")
r = run("DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq && echo 'UPGRADE_OK'", timeout=300)
print(r[-300:])

print("\n=== Temel paketler ===")
r = run("apt-get install -y -qq curl wget git ufw ca-certificates gnupg lsb-release && echo 'PKGS_OK'", timeout=120)
print(r[-300:])

client.close()
print("\n=== ASAMA 1 TAMAM ===")
