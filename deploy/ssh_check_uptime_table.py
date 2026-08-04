import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=15):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t): print(t.encode('ascii', 'replace').decode('ascii'))

p("=== SiteUptimeLogs table exists? ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname=$$public$$ AND tablename=$$SiteUptimeLogs$$);
' 2>&1"""))

p("\n=== Last migration ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c '
SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 3;
' 2>&1"""))

client.close()
