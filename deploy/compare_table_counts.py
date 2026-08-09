# -*- coding: utf-8 -*-
"""Local ile server DB tablo kayıt sayılarını karşılaştırır."""
import os, sys
import paramiko
import psycopg2

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

# LOCAL
local_conn = psycopg2.connect(
    host='127.0.0.1', port=5435, dbname='EcomDb',
    user='ecom', password='ecom_dev_2026'
)
cur = local_conn.cursor()
cur.execute("""
    SELECT tablename FROM pg_tables WHERE schemaname='public'
    ORDER BY tablename;
""")
tables = [r[0] for r in cur.fetchall()]

local_counts = {}
for t in tables:
    try:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        local_counts[t] = cur.fetchone()[0]
    except Exception as e:
        local_counts[t] = f'ERR:{e}'
cur.close()
local_conn.close()

# SERVER
host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()

# Tüm tabloları server'da say
count_sql = "\n".join([
    f"SELECT '{t}', COUNT(*) FROM \"{t}\";"
    for t in tables
])

sftp = client.open_sftp()
with sftp.open('/tmp/count_tables.sql', 'w') as f:
    f.write(count_sql)
sftp.close()

raw = run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t -A -F'|' < /tmp/count_tables.sql", timeout=120)
server_counts = {}
for line in raw.splitlines():
    parts = line.strip().split('|')
    if len(parts) == 2:
        try:
            server_counts[parts[0]] = int(parts[1])
        except:
            server_counts[parts[0]] = parts[1]

client.close()

# Karşılaştır
print(f"{'Tablo':<40} {'Local':>12} {'Server':>12} {'Fark':>12}")
print("-" * 80)

import_needed = []
for t in tables:
    lc = local_counts.get(t, 0)
    sc = server_counts.get(t, 0)
    try:
        diff = int(sc) - int(lc) if isinstance(sc, int) and isinstance(lc, int) else '?'
    except:
        diff = '?'
    flag = " <-- FARK VAR" if isinstance(diff, int) and diff > 0 else ""
    print(f"  {t:<38} {str(lc):>12} {str(sc):>12} {str(diff):>12}{flag}")
    if isinstance(diff, int) and diff > 0:
        import_needed.append((t, lc, sc, diff))

print(f"\n\nFark olan tablolar ({len(import_needed)}):")
for t, lc, sc, diff in sorted(import_needed, key=lambda x: -x[3]):
    print(f"  {t:<40} local:{lc:>10,}  server:{sc:>10,}  fark:{diff:>10,}")
