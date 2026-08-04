# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

p("=== SSL certs ===")
p(run("sudo certbot certificates 2>/dev/null | grep -E 'Domains|Expiry|Certificate' || ls /etc/letsencrypt/live/ 2>/dev/null || echo 'no certbot'"))

p("\n=== nginx ssl_certificate lines ===")
p(run("grep 'ssl_certificate' /etc/nginx/sites-available/autoforcepart.conf 2>/dev/null"))

p("\n=== nginx listen 443 ===")
p(run("grep 'listen 443\\|listen.*ssl' /etc/nginx/sites-available/autoforcepart.conf 2>/dev/null"))

client.close()
