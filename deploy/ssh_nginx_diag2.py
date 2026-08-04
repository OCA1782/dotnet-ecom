# -*- coding: utf-8 -*-
import os, sys
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

p("=== nginx access log last 50 lines ===")
p(run("sudo tail -50 /var/log/nginx/access.log 2>/dev/null"))

p("\n=== nginx error log last 10 lines ===")
p(run("sudo tail -10 /var/log/nginx/error.log 2>/dev/null"))

p("\n=== nginx server_name blocks ===")
p(run("grep 'server_name' /etc/nginx/sites-available/autoforcepart.conf 2>/dev/null"))

p("\n=== curl test from server to self via www ===")
p(run("curl -sk -o /dev/null -w 'HTTP %{http_code} | %{time_total}s | IP: %{remote_ip}' -H 'Host: www.autoforcepart.com' http://127.0.0.1/ --max-time 10"))

p("\n=== docker containers status ===")
p(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -v '^NAMES'"))

client.close()
p("Done.")
