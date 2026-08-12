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

print('=== Python executable leri ===')
print(run('which python python3 python3.12 2>/dev/null'))
print(run('ls /usr/bin/python* /usr/local/bin/python* 2>/dev/null'))

print('\n=== Virtual environment leri ===')
print(run('find /opt /home /root /var -name "activate" -path "*/bin/activate" 2>/dev/null | head -20'))

print('\n=== Sistem python3 paketleri (boto/psyco/request) ===')
print(run('dpkg -l | grep -iE "python3.*(boto|request|psyco)" 2>/dev/null || echo "dpkg bulunamadi"'))

print('\n=== dist-packages icerigi ===')
print(run('ls /usr/lib/python3/dist-packages/ 2>/dev/null | grep -iE "boto|request|psyco"'))
print(run('ls /usr/local/lib/python3.12/dist-packages/ 2>/dev/null | grep -iE "boto|request|psyco"'))

print('\n=== Onceki migration scriptleri nasil calisiyordu — shebang ===')
print(run('head -3 /tmp/r2_migration_server.py 2>/dev/null || echo YOK'))

print('\n=== get-pip.py ile pip kur ===')
print(run('curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py 2>&1 && echo "Indirildi" || echo "HATA"'))
print(run('python3 /tmp/get-pip.py 2>&1 | tail -5', timeout=120))
print(run('python3 -m pip --version 2>&1'))

ssh.close()
