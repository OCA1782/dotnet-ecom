# -*- coding: utf-8 -*-
import os, sys, time
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def run(cmd, timeout=120):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    out = (o.read() + e.read()).decode('utf-8', errors='replace').strip()
    return out

def p(t):
    print(t.encode('ascii', errors='replace').decode('ascii'))

p("=== git pull ===")
p(run("cd /opt/ecom && git pull origin main", timeout=60))

# API: rebuild (nginx volume mount eklendi)
p("\n=== docker compose build api ===")
p(run("cd /opt/ecom && docker compose build api 2>&1 | tail -15", timeout=900))

# Admin: rebuild
p("\n=== docker compose build admin ===")
p(run("cd /opt/ecom && docker compose build admin 2>&1 | tail -15", timeout=900))

p("\n=== docker compose up -d api admin ===")
p(run("cd /opt/ecom && docker compose up -d api admin 2>&1", timeout=120))

p("\nBekleniyor (50s)...")
time.sleep(50)

p("\n=== Container durumu ===")
p(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=30))

p("\n=== API health ===")
p(run("curl -s http://localhost:15124/health 2>/dev/null | head -c 100", timeout=15))

p("\n=== Nginx log dosyasi API container icerisinden erisebilir mi? ===")
p(run("docker exec ecom-api-1 ls -la /var/log/nginx/ 2>&1 | head -5", timeout=10))

p("\n=== nginx-logs endpoint testi (auth gerektiriyor - 401 beklenir) ===")
p(run("curl -s -w '\nHTTP: %{http_code}' http://localhost:15124/api/admin/site-monitor/nginx-logs 2>/dev/null | tail -2", timeout=15))

p("\n=== Admin frontend erisim ===")
p(run("curl -sk https://admin.autoforcepart.com/site-monitor -o /dev/null -w 'HTTP: %{http_code}' --max-time 10 2>/dev/null", timeout=15))

client.close()
p("\n=== TAMAMLANDI ===")
