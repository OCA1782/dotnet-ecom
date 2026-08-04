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

p("=== DNS via 1.1.1.1 (Cloudflare) ===")
p(run("dig @1.1.1.1 www.autoforcepart.com A +short 2>/dev/null || host www.autoforcepart.com 1.1.1.1 2>/dev/null"))

p("\n=== DNS via 8.8.8.8 (Google) ===")
p(run("dig @8.8.8.8 www.autoforcepart.com A +short 2>/dev/null"))

p("\n=== HTTP test www ===")
p(run("curl -sk -o /dev/null -w 'HTTP %{http_code} | %{time_total}s | IP: %{remote_ip}' https://www.autoforcepart.com/ --max-time 10 --resolve 'www.autoforcepart.com:443:31.210.40.242'"))

p("\n=== Direct origin test (bypass DNS) ===")
p(run("curl -sk -o /dev/null -w 'HTTP %{http_code} | %{time_total}s' -H 'Host: www.autoforcepart.com' https://31.210.40.242/ --insecure --max-time 10"))

client.close()
p("\nDone.")
