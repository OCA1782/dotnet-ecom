# -*- coding: utf-8 -*-
import os, sys, paramiko
sys.stdout.reconfigure(encoding='utf-8')

_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(_env, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            if k.strip() not in os.environ:
                os.environ[k.strip()] = v.strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.environ['DEPLOY_SSH_HOST'],
            username=os.environ['DEPLOY_SSH_USER'],
            password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run(cmd, timeout=60):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

print('=== Worker PID ===')
pid = run('pgrep -f r2_worker.py || echo DURDU')
print(pid)

print('\n=== Son log (25 satir) ===')
print(run('tail -25 /tmp/r2_migration.log 2>/dev/null || echo YOK'))

print('\n=== DB Ozet ===')
sql = 'SELECT "Status", COUNT(*) FROM "ImageMigrationLog" GROUP BY "Status" ORDER BY COUNT(*) DESC;'
print(run(f'docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb -t -c \'{sql}\'', timeout=60))

print('\n=== Progress dosyasi ===')
print(run('head -15 /tmp/r2_migration_progress.txt 2>/dev/null || echo YOK'))

ssh.close()
