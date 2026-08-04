# -*- coding: utf-8 -*-
import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=20):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', errors='replace').strip()

def p(t):
    print(t.encode('ascii', errors='replace').decode('ascii'))

p("=== Migration kaydi ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c 'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 5' 2>&1"""))

p("\n=== SiteUptimeLogs tablosu var mi? ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c 'SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname=$$public$$ AND tablename=$$SiteUptimeLogs$$)' 2>&1"""))

p("\n=== SiteUptimeLogs kayit sayisi (25s sonra gelecek) ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c 'SELECT COUNT(*) FROM "SiteUptimeLogs"' 2>&1"""))

p("\n=== API /api/admin/site-monitor/status (no auth test) ===")
p(r("curl -s http://localhost:15124/api/admin/site-monitor/status -w '\nHTTP: %{http_code}' 2>/dev/null | head -c 400"))

p("\n=== SiteMonitor servis logu (son 5 satir) ===")
p(r("docker logs ecom-api-1 --tail 30 2>&1 | grep -i 'monitor\|uptime\|site' | tail -10"))

client.close()
