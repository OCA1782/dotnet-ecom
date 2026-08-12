# -*- coding: utf-8 -*-
"""Tüm jobların mevcut durumunu kontrol eder ve paused olmayanları durdurur."""
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

import urllib.parse

# Login
login_payload = json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
resp = run(f"curl -s -X POST {BASE}/api/auth/login -H 'Content-Type: application/json' -d '{login_payload}'", timeout=15)
data = json.loads(resp)
token = data.get("token") or data.get("accessToken") or data.get("data", {}).get("token", "")
if not token:
    print(f"Token alinamadi: {resp[:200]}")
    client.close()
    sys.exit(1)
print("Login OK.")

# Mevcut job durumlarini al
jobs_resp = run(f"curl -s {BASE}/api/admin/jobs -H 'Authorization: Bearer {token}'", timeout=15)
jobs = json.loads(jobs_resp)
if isinstance(jobs, dict):
    jobs = jobs.get("data") or jobs.get("items") or list(jobs.values())

print(f"\n=== Mevcut Job Durumlari ({len(jobs)} job) ===")
print(f"{'Job Adi':<45} {'IsPaused':>10} {'IsRunning':>10}")
print("-" * 70)

not_paused = []
for job in jobs:
    name = job.get("name") or ""
    is_paused = bool(job.get("isPaused") or job.get("paused") or False)
    is_running = bool(job.get("isRunning") or job.get("running") or False)
    print(f"  {name:<43} {str(is_paused):>10} {str(is_running):>10}")
    if not is_paused:
        not_paused.append((name, job))

print(f"\nPaused olmayan job sayisi: {len(not_paused)}")

if not not_paused:
    print("Tum joblar zaten paused!")
    client.close()
    sys.exit(0)

print("\n=== Paused olmayan joblar durduruluyor ===")
paused_ok = 0
errors = 0
for name, job in not_paused:
    encoded = urllib.parse.quote(name, safe='')
    result = run(f"curl -s -X PUT {BASE}/api/admin/jobs/{encoded}/toggle -H 'Authorization: Bearer {token}' -H 'Content-Type: application/json'", timeout=10)
    try:
        r = json.loads(result)
        new_paused = r.get("paused") or r.get("isPaused") or False
        if new_paused:
            paused_ok += 1
            print(f"  [OK] {name} -> paused")
        else:
            errors += 1
            print(f"  [HATA] {name}: {result[:100]}")
    except Exception:
        errors += 1
        print(f"  [PARSE HATA] {name}: {result[:80]}")
    time.sleep(0.05)

print(f"\n=== SONUC ===")
print(f"Durduruldu: {paused_ok}")
print(f"Hata      : {errors}")

# Final dogrulama
print("\n=== Final Job Durumlari ===")
jobs_resp2 = run(f"curl -s {BASE}/api/admin/jobs -H 'Authorization: Bearer {token}'", timeout=15)
jobs2 = json.loads(jobs_resp2)
if isinstance(jobs2, dict):
    jobs2 = jobs2.get("data") or jobs2.get("items") or list(jobs2.values())
still_running = [j.get("name","") for j in jobs2 if not (j.get("isPaused") or j.get("paused"))]
print(f"Hala paused olmayan: {len(still_running)}")
for n in still_running:
    print(f"  - {n}")

client.close()
