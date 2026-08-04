# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=20):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

p("=== nginx listening ports ===")
p(run("sudo ss -tlnp | grep nginx"))

p("\n=== curl HTTPS to localhost:443 with SNI ===")
p(run("curl -sk -o /dev/null -w 'HTTP %{http_code} | %{time_total}s' --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' https://www.autoforcepart.com/ --max-time 8"))

p("\n=== curl HTTP to localhost:80 with Host header ===")
p(run("curl -s -o /dev/null -w 'HTTP %{http_code} | %{time_total}s' -H 'Host: www.autoforcepart.com' http://127.0.0.1/ --max-time 5"))

p("\n=== openssl check port 443 ===")
p(run("echo | timeout 5 openssl s_client -connect 127.0.0.1:443 -servername www.autoforcepart.com 2>&1 | grep -E 'subject|issuer|Verify|CONNECTED|error' | head -10"))

p("\n=== nginx conf www server block (listen lines) ===")
p(run("grep -A5 'server_name www.autoforcepart' /etc/nginx/sites-available/autoforcepart.conf 2>/dev/null | head -20"))

client.close()
p("\nDone.")
