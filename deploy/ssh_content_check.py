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

p("=== Ana sayfa icerigi (ilk 10 anlamli satir) ===")
p(run("""curl -sk --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' \
  https://www.autoforcepart.com/ --max-time 10 \
  | grep -oE '<title>[^<]+</title>|google-site-verification[^\"]*|data-template=\"[^\"]+\"' \
  | head -10"""))

p("\n=== /urunler sayfasi ===")
p(run("""curl -sk -o /dev/null -w 'HTTP %{http_code} | %{time_total}s | %{size_download} bytes' \
  --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' \
  https://www.autoforcepart.com/urunler --max-time 10"""))

p("\n=== nginx son 5 customer istegi ===")
p(run("sudo tail -50 /var/log/nginx/access.log 2>/dev/null | grep -v 'admin\\|api.auto' | tail -5"))

client.close()
p("\nDone.")
