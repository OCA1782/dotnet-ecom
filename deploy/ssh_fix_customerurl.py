import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=20):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t):
    print(t.encode('ascii', 'replace').decode('ascii'))

p("=== Update CustomerBaseUrl ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -c 'UPDATE "SiteSettings" SET "Value" = $$https://www.autoforcepart.com$$ WHERE "Key" = $$CustomerBaseUrl$$;' 2>&1"""))

p("\n=== Verify ===")
p(r("""docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -A -c 'SELECT "Key", "Value" FROM "SiteSettings" WHERE "Key" = $$CustomerBaseUrl$$;' 2>&1"""))

client.close()
