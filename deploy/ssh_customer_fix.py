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

p("=== API container IP ===")
p(run("docker inspect ecom-api-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'"))

p("\n=== Customer container env (API URL) ===")
p(run("docker inspect ecom-customer-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -i 'api\\|backend\\|url\\|internal'"))

p("\n=== Customer container full log (son 40 satir) ===")
p(run("docker logs ecom-customer-1 --tail 40 2>&1"))

client.close()
p("\nDone.")
