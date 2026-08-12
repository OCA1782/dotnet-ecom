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

def run(cmd, timeout=300):
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    return (out.read() + err.read()).decode('utf-8', errors='replace').strip()

print('=== sudo kontrol ===')
print(run('sudo -n apt-get install -y python3-psycopg2 2>&1 | head -5'))

print('\n=== venv olustur (system-site-packages = boto3/requests miras alir) ===')
print(run('python3 -m venv /opt/ecom_venv --system-site-packages 2>&1'))

print('\n=== venv icinde pip kontrol ===')
print(run('/opt/ecom_venv/bin/pip --version 2>&1'))

print('\n=== psycopg2-binary kur (venv) ===')
r = run('/opt/ecom_venv/bin/pip install psycopg2-binary 2>&1', timeout=300)
print(r[-2000:])

print('\n=== Dogrulama ===')
print(run('/opt/ecom_venv/bin/python3 -c "import boto3, requests, psycopg2; print(\'OK:\', boto3.__version__, requests.__version__, psycopg2.__version__)"'))

ssh.close()
