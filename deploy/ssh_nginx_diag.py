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

print("=== UFW Status ===")
print(run("sudo ufw status 2>/dev/null || ufw status 2>/dev/null || echo 'ufw not available'"))

print("\n=== fail2ban Status ===")
print(run("sudo fail2ban-client status 2>/dev/null || echo 'fail2ban not running'"))

print("\n=== fail2ban nginx jails ===")
print(run("sudo fail2ban-client status nginx-http-auth 2>/dev/null; sudo fail2ban-client status nginx-botsearch 2>/dev/null; sudo fail2ban-client status sshd 2>/dev/null || true"))

print("\n=== 185.106.208 IP blocked? ===")
print(run("sudo iptables -L -n 2>/dev/null | grep '185.106.208' || echo 'not in iptables'"))

print("\n=== nginx error log (son 30 satir - 185.106 ile ilgili) ===")
print(run("sudo tail -200 /var/log/nginx/error.log 2>/dev/null | grep -i '185.106\\|connect\\|upstream\\|timeout' | tail -30 || echo 'no relevant errors'"))

print("\n=== nginx access log (185.106.208 kaynaklı son istekler) ===")
print(run("sudo grep '185.106.208' /var/log/nginx/access.log 2>/dev/null | tail -20 || sudo zgrep '185.106.208' /var/log/nginx/access.log* 2>/dev/null | tail -10 || echo 'no hits in access log'"))

print("\n=== Cloudflare IP ranges check in nginx conf ===")
print(run("grep -i 'cloudflare\\|185.106\\|allow\\|deny' /etc/nginx/sites-available/autoforcepart.conf 2>/dev/null | head -20 || echo 'no relevant directives'"))

print("\n=== nginx sites config (customer server block ports) ===")
print(run("grep -A3 'server_name.*autoforcepart' /etc/nginx/sites-available/autoforcepart.conf 2>/dev/null | head -40"))

client.close()
print("\nDone.")
