# -*- coding: utf-8 -*-
"""Tüm jobları pause eder."""
import os, sys, json, time
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

def run(cmd, timeout=30):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

BASE = "http://localhost:15124"
ADMIN_EMAIL = "admin@autoforcepart.com"
ADMIN_PASSWORD = "AutoForce2026!"

# Login
login_payload = json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
login_cmd = f"""curl -s -X POST {BASE}/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{login_payload}'"""
resp = run(login_cmd, timeout=15)
try:
    data = json.loads(resp)
    token = data.get("token") or data.get("accessToken") or data.get("data", {}).get("token", "")
except Exception:
    print(f"Login HATA: {resp[:300]}")
    client.close()
    sys.exit(1)

if not token:
    print(f"Token alinamadi: {resp[:300]}")
    client.close()
    sys.exit(1)

print(f"Login OK, token alindi.")

# Tüm jobları listele
jobs_cmd = f"curl -s {BASE}/api/admin/jobs -H 'Authorization: Bearer {token}'"
jobs_resp = run(jobs_cmd, timeout=15)
try:
    jobs = json.loads(jobs_resp)
    if isinstance(jobs, dict):
        jobs = jobs.get("data") or jobs.get("items") or list(jobs.values())
except Exception:
    print(f"Jobs listesi alinamadi: {jobs_resp[:300]}")
    client.close()
    sys.exit(1)

print(f"\nToplam job sayisi: {len(jobs)}")

paused_count = 0
already_paused = 0
error_count = 0

for job in jobs:
    name = job.get("name") or job.get("jobName") or ""
    is_paused = job.get("isPaused") or job.get("paused") or False
    if not name:
        continue
    if is_paused:
        already_paused += 1
        print(f"  [ZATEN DURDURULMUS] {name}")
        continue
    # Toggle (pause)
    import urllib.parse
    encoded = urllib.parse.quote(name, safe='')
    toggle_cmd = f"curl -s -X PUT {BASE}/api/admin/jobs/{encoded}/toggle -H 'Authorization: Bearer {token}' -H 'Content-Type: application/json'"
    result = run(toggle_cmd, timeout=10)
    try:
        r = json.loads(result)
        new_state = r.get("paused") or r.get("isPaused") or r.get("data", {}).get("paused", None)
        if new_state:
            paused_count += 1
            print(f"  [DURDURULDU] {name}")
        else:
            print(f"  [?] {name}: {result[:100]}")
    except Exception:
        error_count += 1
        print(f"  [HATA] {name}: {result[:100]}")
    time.sleep(0.1)

print(f"\n=== SONUC ===")
print(f"Durduruldu   : {paused_count}")
print(f"Zaten durdu  : {already_paused}")
print(f"Hata         : {error_count}")

client.close()
