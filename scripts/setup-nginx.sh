#!/bin/bash
# Nginx reverse proxy kurulum scripti
# Kullanım: DOMAIN=yourdomain.com bash scripts/setup-nginx.sh
# Gereklilik: domain DNS A kaydı bu sunucunun IP'sine yönlendirilmiş olmalı

set -e

DOMAIN="${DOMAIN:?DOMAIN ortam değişkeni gerekli (örn: DOMAIN=example.com bash setup-nginx.sh)}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"

echo "=== Nginx + Certbot kurulumu: ${DOMAIN} ==="

# Nginx kur
apt-get update -q
apt-get install -y nginx certbot python3-certbot-nginx

# Nginx config
cat > "/etc/nginx/sites-available/ecom" << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN} api.${DOMAIN} admin.${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name admin.${DOMAIN};
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name api.${DOMAIN};
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5124;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ecom /etc/nginx/sites-enabled/ecom
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# SSL sertifikası al
certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  -d "admin.${DOMAIN}" \
  -d "api.${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --non-interactive \
  --redirect

# Otomatik yenileme test
certbot renew --dry-run

echo ""
echo "=== Kurulum tamamlandı ==="
echo "Customer : https://${DOMAIN}"
echo "Admin    : https://admin.${DOMAIN}"
echo "API      : https://api.${DOMAIN}"
echo ""
echo "Sonraki adımlar:"
echo "  1. .env dosyasında NEXT_PUBLIC_API_URL=https://api.${DOMAIN} güncelleyin"
echo "  2. .env dosyasında ALLOWED_ORIGIN_0=https://${DOMAIN} ve ALLOWED_ORIGIN_1=https://admin.${DOMAIN} güncelleyin"
echo "  3. ASPNETCORE_ENVIRONMENT=Production yapın"
echo "  4. docker compose build && docker compose up -d"
