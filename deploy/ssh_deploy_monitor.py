# -*- coding: utf-8 -*-
import os, sys, time
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

host = '31.210.40.242'
user = 'bilgi'
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)

def run(cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(t):
    print(t.encode('ascii', errors='replace').decode('ascii'))

# Step 1: Apply migration SQL
p("=== Step 1: SiteUptimeLogs migration ===")
migration_sql = """
BEGIN;

CREATE TABLE IF NOT EXISTS "SiteUptimeLogs" (
    "Id"            uuid        NOT NULL,
    "Url"           text        NOT NULL,
    "IsUp"          boolean     NOT NULL,
    "HttpStatusCode" integer    NULL,
    "ResponseTimeMs" bigint     NOT NULL,
    "ErrorMessage"  text        NULL,
    "CheckedAt"     timestamptz NOT NULL,
    CONSTRAINT "PK_SiteUptimeLogs" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_SiteUptimeLogs_CheckedAt" ON "SiteUptimeLogs" ("CheckedAt");
CREATE INDEX IF NOT EXISTS "IX_SiteUptimeLogs_IsUp" ON "SiteUptimeLogs" ("IsUp");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260804120000_AddSiteUptimeLog', '9.0.0')
ON CONFLICT DO NOTHING;

COMMIT;
"""

psql_cmd = f"""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c '{migration_sql.replace("'", "\\'")}' 2>&1"""

# Use heredoc approach via tee+file to avoid quote issues
write_sql = f"""cat > /tmp/migration_uptime.sql << 'SQLEOF'
{migration_sql}
SQLEOF"""
p(run(write_sql, timeout=10))

p("Running migration SQL...")
p(run("docker exec -i ecom-postgres-1 psql -U ecom -d EcomDb < /tmp/migration_uptime.sql 2>&1", timeout=30))

p("\n=== Verify table created ===")
p(run("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c "
SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='SiteUptimeLogs');
" 2>&1""", timeout=15))

p("\n=== Verify migration registered ===")
p(run("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c "
SELECT \"MigrationId\" FROM \"__EFMigrationsHistory\" ORDER BY \"MigrationId\" DESC LIMIT 5;
" 2>&1""", timeout=15))

# Step 2: Deploy API
p("\n=== Step 2: git pull ===")
p(run("cd /opt/ecom && git pull origin main", timeout=60))

p("\n=== docker compose build api ===")
p(run("cd /opt/ecom && docker compose build api 2>&1 | tail -25", timeout=900))

p("\n=== docker compose up -d api ===")
p(run("cd /opt/ecom && docker compose up -d api 2>&1", timeout=120))

p("\nBekleniyor (40s)...")
time.sleep(40)

p("\n=== Container durumu ===")
p(run("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", timeout=30))

p("\n=== API health ===")
p(run("curl -s http://localhost:15124/health 2>/dev/null | head -c 200", timeout=15))

p("\n=== API monitor status endpoint testi ===")
p(run("curl -s -H 'Accept: application/json' http://localhost:15124/api/admin/site-monitor/status 2>/dev/null | head -c 300", timeout=20))

p("\n=== API son loglar (hata var mi?) ===")
p(run("docker logs ecom-api-1 --tail 20 2>&1", timeout=15))

client.close()
p("\n=== TAMAMLANDI ===")
