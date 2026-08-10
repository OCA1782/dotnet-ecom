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
ssh.connect(os.environ['DEPLOY_SSH_HOST'], username=os.environ['DEPLOY_SSH_USER'],
            password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run(cmd, timeout=30):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

# Tum migration worker'larini durdur
print('=== Caliskan python processleri ===')
print(run('pgrep -a python3'))

print('\n=== Durdurma ===')
print(run('pkill -f r2_worker.py 2>/dev/null && echo "r2_worker.py durduruldu" || echo "r2_worker.py zaten yuktu"'))
print(run('pkill -f r2_fresh_worker.py 2>/dev/null && echo "r2_fresh_worker.py durduruldu" || echo "r2_fresh_worker.py zaten yuktu"'))
print(run('pkill -f r2_migration 2>/dev/null && echo "r2_migration durduruldu" || echo "r2_migration zaten yuktu"'))
print(run('pkill -f oyp_parallel 2>/dev/null && echo "oyp_parallel durduruldu" || echo "oyp_parallel zaten yuktu"'))

import time; time.sleep(2)
print('\n=== Kalanlar ===')
r = run('pgrep -a python3')
print(r if r else 'Hic python3 processi yok')

ssh.close()
