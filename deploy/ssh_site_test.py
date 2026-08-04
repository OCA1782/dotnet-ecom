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

p("=== Docker container durumu ===")
p(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"))

p("\n=== Customer container log (son 20 satir) ===")
p(run("docker logs ecom-customer-1 --tail 20 2>&1"))

p("\n=== Customer container iceriden test ===")
p(run("curl -sk -o /dev/null -w 'HTTP %{http_code} | %{time_total}s' http://127.0.0.1:13000/ --max-time 10"))

p("\n=== Nginx -> Customer proxy test ===")
p(run("curl -sk -o /dev/null -w 'HTTP %{http_code} | %{time_total}s' --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' https://www.autoforcepart.com/ --max-time 10"))

p("\n=== Nginx -> Customer ana sayfa boyutu ===")
p(run("curl -sk --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' https://www.autoforcepart.com/ --max-time 10 | wc -c"))

p("\n=== Nginx access log (son 10 customer istegi) ===")
p(run("sudo grep 'autoforcepart.com' /var/log/nginx/access.log 2>/dev/null | grep -v 'admin\\|api' | tail -10"))

client.close()
p("\nDone.")
