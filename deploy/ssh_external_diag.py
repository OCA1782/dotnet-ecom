# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=25):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

p("=== www DNS - multiple resolvers ===")
p(run("dig @1.1.1.1 www.autoforcepart.com A +short && echo '---1.1.1.1'"))
p(run("dig @8.8.8.8 www.autoforcepart.com A +short && echo '---8.8.8.8'"))
p(run("dig @9.9.9.9 www.autoforcepart.com A +short && echo '---9.9.9.9'"))
p(run("dig @208.67.222.222 www.autoforcepart.com A +short && echo '---OpenDNS'"))

p("\n=== TTL kac saniye kaldi? ===")
p(run("dig @1.1.1.1 www.autoforcepart.com A | grep 'autoforcepart.*IN.*A'"))

p("\n=== apex domain DNS ===")
p(run("dig @1.1.1.1 autoforcepart.com A +short"))

p("\n=== SSL handshake from external perspective ===")
p(run("echo | timeout 8 openssl s_client -connect 31.210.40.242:443 -servername www.autoforcepart.com 2>&1 | grep -E 'CONNECTED|subject|issuer|Verify|error|FAILED'"))

p("\n=== nginx error log - son 5 satir ===")
p(run("sudo tail -5 /var/log/nginx/error.log 2>/dev/null"))

p("\n=== nginx access log - son gercek ziyaretci (bot degil) ===")
p(run("sudo tail -200 /var/log/nginx/access.log 2>/dev/null | grep -v 'curl\\|Go-http\\|python\\|bot\\|scan\\|zgrab' | grep 'autoforcepart.com' | grep -v 'admin\\|/api/' | tail -5"))

client.close()
p("\nDone.")
