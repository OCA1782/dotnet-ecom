# -*- coding: utf-8 -*-
"""Retry migration durumunu sunucudan okur."""
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

_local_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(_local_env):
    with open(_local_env, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, _, v = line.partition('=')
                if k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip()

host     = os.environ['DEPLOY_SSH_HOST']
user     = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

pid = run("pgrep -f r2_retry_errors_server.py")
status = "ÇALIŞIYOR" if pid else "DURDU"
print(f"Durum : {status}" + (f" (PID: {pid})" if pid else ""))

done_count = run("wc -l < /tmp/r2_retry_progress.txt 2>/dev/null || echo 0").strip()
print(f"Tamamlanan (retry): {done_count} görsel")

err_count = run("wc -l < /tmp/r2_retry_errors.log 2>/dev/null || echo 0").strip()
print(f"Hata sayısı (retry): {err_count}")

print("\n--- Son log satırları ---")
print(run("tail -15 /tmp/r2_retry.log 2>/dev/null || echo '(log yok)'"))

client.close()
