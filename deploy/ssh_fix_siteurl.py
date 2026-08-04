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

p("=== Mevcut SiteUrl ===")
p(run('docker exec ecom-postgres-1 psql -U postgres -d EcomDb -c "SELECT \\"Key\\", \\"Value\\" FROM \\"SiteSettings\\" WHERE \\"Key\\" IN (\'SiteUrl\',\'SiteName\',\'CustomerSiteUrl\') ORDER BY \\"Key\\";" 2>/dev/null'))

p("\n=== SiteUrl guncelleniyor ===")
p(run('docker exec ecom-postgres-1 psql -U postgres -d EcomDb -c "UPDATE \\"SiteSettings\\" SET \\"Value\\" = \'https://www.autoforcepart.com\' WHERE \\"Key\\" = \'SiteUrl\';" 2>/dev/null'))

p("\n=== Dogrulama ===")
p(run('docker exec ecom-postgres-1 psql -U postgres -d EcomDb -c "SELECT \\"Key\\", \\"Value\\" FROM \\"SiteSettings\\" WHERE \\"Key\\" IN (\'SiteUrl\',\'SiteName\') ORDER BY \\"Key\\";" 2>/dev/null'))

client.close()
p("\nDone.")
