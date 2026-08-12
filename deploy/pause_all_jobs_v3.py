# -*- coding: utf-8 -*-
"""Tüm jobları pause eder - state.isPaused doğru okuma."""
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

import urllib.parse

BASE = "http://localhost:15124"
ADMIN_EMAIL = "admin@autoforcepart.com"
ADMIN_PASSWORD = "AutoForce2026!"

# Login
login_payload = json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
resp = run(f"curl -s -X POST {BASE}/api/auth/login -H 'Content-Type: application/json' -d '{login_payload}'", timeout=15)
data = json.loads(resp)
token = data.get("token") or data.get("accessToken") or ""
if not token:
    print(f"Token alinamadi: {resp[:200]}")
    client.close()
    sys.exit(1)
print("Login OK.")

def get_jobs():
    resp = run(f"curl -s {BASE}/api/admin/jobs -H 'Authorization: Bearer {token}'", timeout=15)
    jobs = json.loads(resp)
    if isinstance(jobs, dict):
        jobs = jobs.get("data") or jobs.get("items") or list(jobs.values())
    return jobs

def is_job_paused(job):
    # isPaused is nested inside job.state
    state = job.get("state") or {}
    return bool(state.get("isPaused", False))

jobs = get_jobs()
print(f"\n=== Mevcut Job Durumlari ({len(jobs)} job) ===")
print(f"{'Job Adi':<45} {'IsPaused':>10}")
print("-" * 60)
for job in jobs:
    name = job.get("name", "")
    paused = is_job_paused(job)
    print(f"  {name:<43} {str(paused):>10}")

not_paused = [(j.get("name",""), j) for j in jobs if not is_job_paused(j)]
already_paused = [j.get("name","") for j in jobs if is_job_paused(j)]

print(f"\nZaten paused: {len(already_paused)}")
print(f"Pause edilecek: {len(not_paused)}")

if not not_paused:
    print("Tum joblar zaten paused!")
    client.close()
    sys.exit(0)

print("\n=== Joblar durduruluyor ===")
paused_ok = 0
errors = 0
for name, job in not_paused:
    encoded = urllib.parse.quote(name, safe='')
    result = run(
        f"curl -s -X PUT {BASE}/api/admin/jobs/{encoded}/toggle "
        f"-H 'Authorization: Bearer {token}' -H 'Content-Type: application/json'",
        timeout=10
    )
    try:
        r = json.loads(result)
        # Toggle response: {"paused": true/false}
        new_paused = r.get("paused", False)
        if new_paused:
            paused_ok += 1
            print(f"  [DURDURULDU] {name}")
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
print("\n=== Final Dogrulama ===")
jobs2 = get_jobs()
still_active = [(j.get("name",""), j) for j in jobs2 if not is_job_paused(j)]
print(f"Hala aktif (paused olmayan): {len(still_active)}")
for name, _ in still_active:
    print(f"  ! {name}")
if not still_active:
    print("  Tüm joblar başarıyla durduruldu.")

client.close()
