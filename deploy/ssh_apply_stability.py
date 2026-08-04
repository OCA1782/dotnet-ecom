# -*- coding: utf-8 -*-
import os
import paramiko

host = os.environ['DEPLOY_SSH_HOST']
user = os.environ['DEPLOY_SSH_USER']
password = os.environ['DEPLOY_SSH_PASSWORD']

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=30)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return (out + err).strip()

def p(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))

# ── 1. nginx.conf: worker_connections + TLS + gzip ────────────────────────────
NGINX_CONF = r"""user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log warn;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    types_hash_max_size 2048;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL - only TLS 1.2 and 1.3
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Logging
    access_log /var/log/nginx/access.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/json
        application/javascript
        application/x-javascript
        text/xml
        application/xml
        application/xml+rss
        image/svg+xml
        font/ttf
        font/opentype
        application/vnd.ms-fontobject;

    keepalive_timeout 65;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
"""

p("=== Writing nginx.conf ===")
write_cmd = "sudo tee /etc/nginx/nginx.conf > /dev/null << 'NGINXEOF'\n" + NGINX_CONF + "\nNGINXEOF"
p(run(write_cmd))

# ── 2. sites config: fix map + keepalive + proxy_next_upstream ────────────────
SITES_CONF = r"""# autoforcepart.com nginx reverse proxy

# WebSocket upgrade map — '' maps to '' to allow upstream keepalive
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

p("\n=== Writing sites config ===")
write_sites = "sudo tee /etc/nginx/sites-available/autoforcepart.conf > /dev/null << 'SITESEOF'\n" + SITES_CONF + "\nSITESEOF"
p(run(write_sites))

# ── 3. Docker daemon.json for log rotation ─────────────────────────────────────
DAEMON_JSON = '{\n  "log-driver": "json-file",\n  "log-opts": {\n    "max-size": "100m",\n    "max-file": "3"\n  }\n}\n'

p("\n=== Writing Docker daemon.json ===")
p(run("echo '" + DAEMON_JSON.replace("'", "") + "' | sudo tee /etc/docker/daemon.json"))

# ── 4. Test nginx config ───────────────────────────────────────────────────────
p("\n=== nginx config test ===")
p(run("sudo nginx -t 2>&1"))

# ── 5. Reload nginx ────────────────────────────────────────────────────────────
p("\n=== nginx reload ===")
p(run("sudo nginx -s reload 2>&1 || sudo systemctl reload nginx 2>&1"))

# ── 6. Verify ─────────────────────────────────────────────────────────────────
import time
time.sleep(2)
p("\n=== Post-reload HTTPS test ===")
p(run("curl -sk -o /dev/null -w 'www: HTTP %{http_code} | %{time_total}s' --connect-to 'www.autoforcepart.com:443:127.0.0.1:443' https://www.autoforcepart.com/ --max-time 10"))

p("\n=== nginx status ===")
p(run("systemctl is-active nginx"))

client.close()
p("\nDone.")
