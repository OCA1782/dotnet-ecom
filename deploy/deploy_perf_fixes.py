#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deploy performance fixes to production:
1. git pull
2. Build & restart API (Redis caching for products/suggestions/settings)
3. Build & restart customer (layout.tsx revalidate=30)
4. Upload disk-monitor.sh and add to cron
"""

import os, sys, paramiko, time
sys.stdout.reconfigure(encoding='utf-8')

HOST = '31.210.40.242'
USER = 'bilgi'
PASSWORD = os.environ.get('DEPLOY_SSH_PASSWORD', 'nAqAcUFeb9vUbruMon0b!')
COMPOSE_DIR = '/opt/ecom'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

def run(cmd, timeout=120, show=True):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if show:
        if out.strip(): print(out.rstrip())
        if err.strip(): print('[ERR]', err.rstrip()[:500])
    return out, err

print("=" * 60)
print("STEP 1: Git pull")
print("=" * 60)
run(f'cd {COMPOSE_DIR} && git pull origin main', timeout=60)

print()
print("=" * 60)
print("STEP 2: Upload disk-monitor.sh")
print("=" * 60)
script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'scripts', 'disk-monitor.sh')
with open(script_path, 'rb') as f:
    content = f.read()

sftp = client.open_sftp()
remote_path = f'{COMPOSE_DIR}/scripts/disk-monitor.sh'
with sftp.file(remote_path, 'wb') as rf:
    rf.write(content)
run(f'chmod +x {COMPOSE_DIR}/scripts/disk-monitor.sh')
print(f"Uploaded: {remote_path}")

print()
print("STEP 2b: Add disk-monitor.sh to cron (every 6 hours)")
cron_line = f'0 */6 * * * /opt/ecom/scripts/disk-monitor.sh >> /opt/ecom/logs/disk-monitor.log 2>&1'
out, _ = run(f'crontab -l 2>/dev/null || true', show=False)
if 'disk-monitor' not in out:
    new_crontab = out.rstrip() + '\n' + cron_line + '\n'
    run(f'echo "{new_crontab}" | crontab -', show=False)
    print(f"Added to cron: {cron_line}")
else:
    print("disk-monitor.sh already in cron — skipped")
sftp.close()

print()
print("=" * 60)
print("STEP 3: Build & restart API")
print("=" * 60)
run(f'cd {COMPOSE_DIR} && docker compose build api', timeout=600, show=True)
run(f'cd {COMPOSE_DIR} && docker compose up -d --force-recreate --no-deps api', timeout=60)
print("Waiting 30s for API health...")
time.sleep(30)
out, _ = run(f'curl -sf http://localhost:15124/health -o /dev/null -w "API health: HTTP %{{http_code}}\\n"')

print()
print("=" * 60)
print("STEP 4: Build & restart customer (layout.tsx revalidate=30)")
print("=" * 60)
run(f'cd {COMPOSE_DIR} && docker compose build customer', timeout=600, show=True)
run(f'cd {COMPOSE_DIR} && docker compose up -d --force-recreate --no-deps customer', timeout=60)
print("Waiting 20s for customer startup...")
time.sleep(20)

print()
print("=" * 60)
print("STEP 5: Performance verification")
print("=" * 60)
print("--- API products (first request, no cache) ---")
out, _ = run('curl -sf "http://localhost:15124/api/products?page=1&pageSize=12&vehicleModel=Opel" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\\n"')

print("--- API products (second request, should be cached) ---")
out, _ = run('curl -sf "http://localhost:15124/api/products?page=1&pageSize=12&vehicleModel=Opel" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\\n"')

print("--- Customer /urunler?arac=Opel ---")
out, _ = run('curl -sf "http://localhost:13000/urunler?arac=Opel" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\\n"', timeout=30)

print("--- Customer /urunler?arac=Opel (second, cached API) ---")
out, _ = run('curl -sf "http://localhost:13000/urunler?arac=Opel" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\\n"', timeout=30)

print()
print("=" * 60)
print("STEP 6: Container status")
print("=" * 60)
run('docker ps --format "table {{.Names}}\\t{{.Status}}"')

client.close()
print("\nDeploy tamamlandi!")
