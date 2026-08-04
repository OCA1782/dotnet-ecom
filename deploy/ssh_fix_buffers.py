import os, paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('31.210.40.242', username='bilgi', password=os.environ['DEPLOY_SSH_PASSWORD'], timeout=15)

def r(cmd, timeout=30):
    s, o, e = client.exec_command(cmd, timeout=timeout)
    return (o.read() + e.read()).decode('utf-8', 'replace').strip()

def p(t):
    print(t.encode('ascii', 'replace').decode('ascii'))

# Mevcut sites config'i oku
p("=== Mevcut proxy buffer ayarlari ===")
p(r("grep -i 'proxy_buffer' /etc/nginx/sites-available/autoforcepart.conf"))

# Buffer ayarlarini ekle - customer ve admin bloklarina
SITES_CONF = r"""# autoforcepart.com nginx reverse proxy

# WebSocket upgrade map
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      '';
}

upstream customer_backend {
    server 127.0.0.1:13000;
    keepalive 32;
    keepalive_requests 1000;
    keepalive_timeout 60s;
}

upstream admin_backend {
    server 127.0.0.1:13001;
    keepalive 16;
    keepalive_requests 1000;
    keepalive_timeout 60s;
}

upstream api_backend {
    server 127.0.0.1:15124;
    keepalive 32;
    keepalive_requests 1000;
    keepalive_timeout 60s;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name autoforcepart.com www.autoforcepart.com;
    return 301 https://www.autoforcepart.com$request_uri;
}

# Apex HTTPS -> www redirect
server {
    listen 443 ssl;
    server_name autoforcepart.com;
    ssl_certificate     /etc/letsencrypt/live/autoforcepart.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autoforcepart.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    return 301 https://www.autoforcepart.com$request_uri;
}

# Customer (www)
server {
    listen 443 ssl;
    server_name www.autoforcepart.com;
    ssl_certificate     /etc/letsencrypt/live/autoforcepart.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autoforcepart.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    client_max_body_size 50m;

    proxy_buffer_size       32k;
    proxy_buffers           16 32k;
    proxy_busy_buffers_size 64k;

    location / {
        proxy_pass         http://customer_backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection $connection_upgrade;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 10s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
        proxy_next_upstream   error timeout http_502 http_503 http_504;
        proxy_next_upstream_timeout 10s;
        proxy_next_upstream_tries 2;
    }
}

# Admin
server {
    listen 80;
    server_name admin.autoforcepart.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name admin.autoforcepart.com;
    ssl_certificate     /etc/letsencrypt/live/autoforcepart.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autoforcepart.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    client_max_body_size 50m;

    proxy_buffer_size       32k;
    proxy_buffers           16 32k;
    proxy_busy_buffers_size 64k;

    location / {
        proxy_pass         http://admin_backend;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection $connection_upgrade;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 10s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
        proxy_next_upstream   error timeout http_502 http_503 http_504;
        proxy_next_upstream_timeout 10s;
        proxy_next_upstream_tries 2;
    }
}

# API
server {
    listen 80;
    server_name api.autoforcepart.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.autoforcepart.com;
    ssl_certificate     /etc/letsencrypt/live/autoforcepart.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/autoforcepart.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    client_max_body_size 100m;

    proxy_buffer_size       64k;
    proxy_buffers           16 64k;
    proxy_busy_buffers_size 128k;

    location / {
        proxy_pass         http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header   Connection "";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_connect_timeout 10s;
        proxy_send_timeout    120s;
        proxy_read_timeout    120s;
        proxy_next_upstream   error timeout http_502 http_503 http_504;
        proxy_next_upstream_timeout 15s;
        proxy_next_upstream_tries 2;
    }
}
"""

p("\n=== Yeni config yaziliyor ===")
cmd = "sudo tee /etc/nginx/sites-available/autoforcepart.conf > /dev/null << 'SITESEOF'\n" + SITES_CONF + "\nSITESEOF"
p(r(cmd))

p("\n=== nginx config test ===")
p(r("sudo nginx -t 2>&1"))

p("\n=== nginx reload ===")
p(r("sudo nginx -s reload 2>&1"))

import time
time.sleep(2)

p("\n=== Test - buffer warning gitti mi? ===")
p(r("curl -sk -o /dev/null -w 'www: HTTP %{http_code} | %{time_total}s | %{size_download}b' --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' https://www.autoforcepart.com/ --max-time 15"))

p("\n=== Son nginx warn/error (buffer) ===")
p(r("sudo tail -5 /var/log/nginx/error.log 2>/dev/null"))

client.close()
