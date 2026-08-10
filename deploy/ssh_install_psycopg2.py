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

def run(cmd, timeout=180):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

print('=== apt psycopg2 arama ===')
print(run('apt-cache search psycopg2 2>/dev/null'))

print('\n=== Kurulum (apt) ===')
print(run('apt-get install -y python3-psycopg2 2>&1 | tail -10', timeout=180))

print('\n=== Dogrulama ===')
print(run('python3 -c "import boto3, requests, psycopg2; print(\'OK:\', boto3.__version__, requests.__version__, psycopg2.__version__)"'))

ssh.close()
