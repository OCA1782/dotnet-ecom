import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=20):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t):
    print(t.encode('ascii', 'replace').decode('ascii'))

p("=== Tables ===")
p(r("docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c 'SELECT tablename FROM pg_tables WHERE schemaname=$$public$$ ORDER BY tablename;' 2>&1 | head -30"))

p("\n=== SiteSettings keys (url/site/name) ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c 'SELECT "Key", left("Value",80) FROM "SiteSettings" WHERE "Key" ILIKE $$%site%$$ OR "Key" ILIKE $$%url%$$ OR "Key" ILIKE $$%name%$$ LIMIT 20;' 2>&1"""))

client.close()
