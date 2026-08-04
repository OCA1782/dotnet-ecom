# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

p("=== Feed endpoint test (sure + boyut) ===")
p(run("curl -sk -o /tmp/feed_test.xml -w 'HTTP %{http_code} | %{time_total}s | %{size_download} bytes' http://127.0.0.1:15124/api/merchant/feed.xml --max-time 60"))

p("\n=== Feed XML - ilk 30 satir ===")
p(run("head -30 /tmp/feed_test.xml 2>/dev/null"))

p("\n=== Feed urun sayisi ===")
p(run("grep -c '<item>' /tmp/feed_test.xml 2>/dev/null || echo 'feed yok'"))

p("\n=== Feed ilk urun detay ===")
p(run("grep -A 20 '<item>' /tmp/feed_test.xml 2>/dev/null | head -25"))

p("\n=== SiteUrl DB ayari ===")
p(run("docker exec ecom-postgres-1 psql -U postgres -d EcomDb -c \"SELECT \\\"Key\\\", \\\"Value\\\" FROM \\\"SiteSettings\\\" WHERE \\\"Key\\\" IN ('SiteUrl','SiteName') ORDER BY \\\"Key\\\";\" 2>/dev/null"))

client.close()
p("\nDone.")
