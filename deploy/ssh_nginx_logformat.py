# -*- coding: utf-8 -*-
# Nginx log formatina $host ve $http_cf_connecting_ip ekler
import os, sys, time
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

# Mevcut cloudflare-realip.conf'u guncelle: log_format ekle
CONF = """# Cloudflare Real IP - https://www.cloudflare.com/ips/
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;
real_ip_header CF-Connecting-IP;
real_ip_recursive on;

# Log format: standard combined + $host + $http_cf_connecting_ip
# $remote_addr = gercek IP (CF real_ip sonrasi)
# $host = hangi virtual host (www / admin / api)
# $http_cf_connecting_ip = Cloudflare'in gonderdigi orijinal IP
log_format ecom '$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" $host $http_cf_connecting_ip';
access_log /var/log/nginx/access.log ecom;
"""

p("=== Yeni cloudflare-realip.conf yaziliyor ===")
write_cmd = "cat > /tmp/cf-realip-new.conf << 'CFEOF'\n" + CONF + "\nCFEOF"
p(r(write_cmd, timeout=5))
p(r("sudo cp /tmp/cf-realip-new.conf /etc/nginx/conf.d/cloudflare-realip.conf", timeout=5))

p("\n=== nginx config test ===")
p(r("sudo nginx -t 2>&1"))

p("\n=== nginx reload ===")
p(r("sudo nginx -s reload 2>&1"))

time.sleep(2)

p("\n=== Test istegi at, yeni log satirini kontrol et ===")
p(r("""curl -sk -o /dev/null \
  -H 'CF-Connecting-IP: 5.6.7.8' \
  --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' \
  https://www.autoforcepart.com/ --max-time 10 2>/dev/null"""))
p(r("sudo tail -3 /var/log/nginx/access.log 2>/dev/null"))

p("\n=== TAMAMLANDI ===")
client.close()
