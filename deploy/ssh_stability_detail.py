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

p("=== Docker log sizes ===")
p(run("sudo du -sh /var/lib/docker/containers/*/\*-json.log 2>/dev/null | sort -rh | head -10"))

p("\n=== Docker daemon log config ===")
p(run("cat /etc/docker/daemon.json 2>/dev/null || echo 'no daemon.json'"))

p("\n=== nginx.conf full ===")
p(run("sudo cat /etc/nginx/nginx.conf"))

p("\n=== nginx log rotation ===")
p(run("cat /etc/logrotate.d/nginx 2>/dev/null || echo 'no nginx logrotate'"))

p("\n=== nginx access log size ===")
p(run("sudo du -sh /var/log/nginx/ 2>/dev/null"))

p("\n=== certbot renew dry-run ===")
p(run("sudo certbot renew --dry-run 2>&1 | grep -E 'Cert|success|error|would|Problem|Congratul' | head -10"))

p("\n=== CPU cores ===")
p(run("nproc"))

client.close()
p("\nDone.")
