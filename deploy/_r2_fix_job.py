# -*- coding: utf-8 -*-
"""
R2 content-type fix job'ını tetikler ve ilerlemeyi izler.
ADMIN_EMAIL ve ADMIN_PASSWORD env var'larını ayarlayın.
"""
import os, sys, json, time
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

host         = os.environ['DEPLOY_SSH_HOST']
ssh_user     = os.environ['DEPLOY_SSH_USER']
ssh_password = os.environ['DEPLOY_SSH_PASSWORD']
admin_email  = os.environ.get('ADMIN_EMAIL', 'admin@autoforcepart.com')
admin_pass   = os.environ.get('ADMIN_PASSWORD', '')

if not admin_pass:
    print("ADMIN_PASSWORD env var eksik.")
    sys.exit(1)

API_BASE = 'https://api.autoforcepart.com'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=ssh_user, password=ssh_password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

# 1. Login
print("=== Admin API Login ===")
sftp = client.open_sftp()
payload = json.dumps({"email": admin_email, "password": admin_pass, "rememberMe": False})
with sftp.file('/tmp/_ecom_login.json', 'w') as f:
    f.write(payload)
sftp.close()

result = run(f'curl -s -X POST "{API_BASE}/api/auth/login" -H "Content-Type: application/json" -d @/tmp/_ecom_login.json', timeout=30)
try:
    data = json.loads(result)
    token = data.get('token', '')
    if not token:
        print(f"Token alınamadı: {result[:200]}")
        client.close()
        sys.exit(1)
    print(f"Token alındı ({len(token)} chars)")
except json.JSONDecodeError:
    print(f"Parse hatası: {result[:200]}")
    client.close()
    sys.exit(1)

# 2. Trigger
print("\n=== R2 Content-Type Fix Job Tetikleniyor ===")
fix_result = run(f'curl -s -X POST "{API_BASE}/api/admin/media/fix-r2-content-types" -H "Authorization: Bearer {token}" -H "Content-Length: 0"', timeout=30)
print(f"Sonuç: {fix_result}")

# 3. Poll progress
print("\n=== İlerleme İzleniyor ===")
for _ in range(60):
    time.sleep(10)
    prog = run(f'curl -s "{API_BASE}/api/admin/media/fix-r2-content-types/progress" -H "Authorization: Bearer {token}"', timeout=20)
    try:
        p = json.loads(prog)
        print(f"  {p.get('state')} | {p.get('processed')}/{p.get('total')} (%{p.get('pct',0)}) | errors: {p.get('errors',0)}")
        if p.get('state') in ('done', 'done-with-errors', 'error'):
            break
    except:
        print(f"  Parse hatası: {prog[:100]}")
        break

client.close()
print("\n=== TAMAMLANDI ===")
