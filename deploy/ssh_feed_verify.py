import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=60):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t):
    print(t.encode('ascii', 'replace').decode('ascii'))

p("=== Feed test (sure + boyut) ===")
p(r("curl -sk -o /tmp/feed2.xml -w 'HTTP %{http_code} | %{time_total}s | %{size_download} bytes' http://127.0.0.1:15124/api/merchant/feed.xml --max-time 60"))

p("\n=== XML declaration (encoding dogru mu?) ===")
p(r("head -c 200 /tmp/feed2.xml"))

p("\n=== Site URL dogru mu? ===")
p(r("grep -o 'autoforcepart.com/urun/[^<]*' /tmp/feed2.xml | head -3"))

p("\n=== Urun sayisi ===")
p(r("grep -c '<item>' /tmp/feed2.xml"))

p("\n=== Ilk urun detay ===")
p(r("grep -o '<item>.*</item>' /tmp/feed2.xml | head -c 600"))

client.close()
