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

print('=== Python versiyonlari ===')
print(run('which python3; python3 --version'))
print(run('which pip3; pip3 --version'))

print('\n=== Mevcut paketler ===')
print(run('python3 -c "import sys; print(sys.path)"'))
print(run('pip3 list | grep -iE "boto|request|psyco"'))

print('\n=== Kurulum ===')
r = run('pip3 install boto3 requests psycopg2-binary 2>&1', timeout=300)
print(r[-2000:])  # Son 2KB

print('\n=== Dogrulama ===')
print(run('python3 -c "import boto3, requests, psycopg2; print(boto3.__version__, requests.__version__, psycopg2.__version__)"'))

ssh.close()
