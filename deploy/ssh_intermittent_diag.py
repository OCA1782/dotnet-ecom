import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=30):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t):
    print(t.encode('ascii', 'replace').decode('ascii'))

p("=== nginx error log - son 30 satir ===")
p(r("sudo tail -30 /var/log/nginx/error.log 2>/dev/null"))

p("\n=== nginx access log - son 1 saatin www istekleri (sadece hata kodlari) ===")
p(r("""sudo awk -v d="$(date -d '1 hour ago' '+%d/%b/%Y:%H:%M')" '
  $0 ~ d || $0 > d
' /var/log/nginx/access.log 2>/dev/null | grep 'www.autoforcepart\|autoforcepart.com' | grep -v '"[23][0-9][0-9]' | tail -20"""))

p("\n=== Son 100 customer isteginde HTTP durum kodlari ===")
p(r("""sudo tail -200 /var/log/nginx/access.log 2>/dev/null \
  | grep -v 'admin\|/api/' \
  | awk '{print $9}' | sort | uniq -c | sort -rn"""))

p("\n=== Son 50 customer istegi (zaman + kod + path) ===")
p(r("""sudo tail -200 /var/log/nginx/access.log 2>/dev/null \
  | grep -v 'admin\.autoforcepart\|/api/\|curl\|zgrab\|Go-http' \
  | awk '{print $4, $9, $7}' | tail -30"""))

p("\n=== Customer container son log (30 satir) ===")
p(r("docker logs ecom-customer-1 --tail 30 2>&1"))

p("\n=== Cloudflare IP'lerinden gelen istekler (son 200 log) ===")
p(r("""sudo tail -200 /var/log/nginx/access.log 2>/dev/null | \
  grep -v 'admin\.autoforcepart\|/api/' | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head -15"""))

p("\n=== DNS www suan hangi IP ===")
p(r("dig @1.1.1.1 www.autoforcepart.com A +short && dig @8.8.8.8 www.autoforcepart.com A +short"))

p("\n=== Customer container uptime ===")
p(r("docker inspect ecom-customer-1 --format 'Started: {{.State.StartedAt}} | Restarts: {{.RestartCount}}'"))

client.close()
