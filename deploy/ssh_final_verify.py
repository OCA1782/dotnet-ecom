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

p("=== DNS: www -> ===")
p(run("dig @1.1.1.1 www.autoforcepart.com A +short"))

p("\n=== HTTPS endpoints ===")
p(run("curl -sk -o /dev/null -w 'www    : HTTP %{http_code} | %{time_total}s\\n' --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' https://www.autoforcepart.com/ --max-time 10"))
p(run("curl -sk -o /dev/null -w 'admin  : HTTP %{http_code} | %{time_total}s\\n' --connect-to 'admin.autoforcepart.com:443:127.0.0.1:443' https://admin.autoforcepart.com/ --max-time 10"))
p(run("curl -sk -o /dev/null -w 'api    : HTTP %{http_code} | %{time_total}s\\n' --connect-to 'api.autoforcepart.com:443:127.0.0.1:443' https://api.autoforcepart.com/health --max-time 10"))

p("\n=== nginx worker_connections (verified) ===")
p(run("grep 'worker_connections' /etc/nginx/nginx.conf"))

p("\n=== nginx TLS (verified) ===")
p(run("grep 'ssl_protocols' /etc/nginx/nginx.conf"))

p("\n=== nginx gzip (verified) ===")
p(run("grep 'gzip_types' /etc/nginx/nginx.conf | head -1"))

p("\n=== Docker daemon.json ===")
p(run("cat /etc/docker/daemon.json"))

p("\n=== nginx error log (son 5 - yeni hata var mi?) ===")
p(run("sudo tail -5 /var/log/nginx/error.log 2>/dev/null | grep -v '2026/08/04 18:'"))

p("\n=== All containers healthy ===")
p(run("docker ps --format '{{.Names}} | {{.Status}}'"))

client.close()
p("\nDone.")
