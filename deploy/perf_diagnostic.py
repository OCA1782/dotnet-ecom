#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Production performance diagnostic."""

import os, sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

HOST = '31.210.40.242'
USER = 'bilgi'
PASSWORD = os.environ.get('DEPLOY_SSH_PASSWORD', 'nAqAcUFeb9vUbruMon0b!')

def run(client, cmd, timeout=60):
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=15)

print("=" * 60)
print("2. API YANIT SURELERI")
print("=" * 60)
out, _ = run(client, '''
echo "--- /health ---"
curl -sf http://localhost:15124/health -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\n"
echo "--- /api/products (page=1&pageSize=12) ---"
curl -sf "http://localhost:15124/api/products?page=1&pageSize=12" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\n"
echo "--- /api/search/suggestions?q=opel ---"
curl -sf "http://localhost:15124/api/search/suggestions?q=opel" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\n"
echo "--- /api/products?arac=Opel ---"
curl -sf "http://localhost:15124/api/products?page=1&pageSize=12&arac=Opel" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\n"
''')
print(out)

print("=" * 60)
print("3. CUSTOMER FRONTEND YANIT SURELERI")
print("=" * 60)
out, _ = run(client, '''
echo "--- / (anasayfa) ---"
curl -sf http://localhost:13000 -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\n"
echo "--- /urunler ---"
curl -sf "http://localhost:13000/urunler" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\n"
echo "--- /urunler?arac=Opel ---"
curl -sf "http://localhost:13000/urunler?arac=Opel" -o /dev/null -w "time_total=%{time_total}s http=%{http_code}\n"
''', timeout=90)
print(out)

print("=" * 60)
print("4. NGINX KONFIGURASYON")
print("=" * 60)
out, _ = run(client, '''
echo "--- sites-enabled ---"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null
echo ""
echo "--- aktif config ---"
cat /etc/nginx/sites-enabled/ecom 2>/dev/null || cat /etc/nginx/sites-enabled/default 2>/dev/null || echo "bulunamadi"
''')
print(out[:4000])

print("=" * 60)
print("5. DISARIDAN HEADER TESTI")
print("=" * 60)
out, _ = run(client, '''
echo "--- autoforcepart.com/ ---"
curl -sI --max-time 10 https://www.autoforcepart.com/ 2>/dev/null | grep -iE "content-encoding|cache-control|x-cache|cf-cache|server|transfer-encoding|vary" | head -10
echo ""
echo "--- /urunler ---"
curl -sI --max-time 10 https://www.autoforcepart.com/urunler 2>/dev/null | grep -iE "content-encoding|cache-control|x-cache|cf-cache|server|vary" | head -10
''')
print(out)

print("=" * 60)
print("6. R2 / GORSEL URL")
print("=" * 60)
out, _ = run(client, '''
R2_URL=$(docker exec ecom-api-1 printenv R2__PublicUrl 2>/dev/null)
STORAGE_URL=$(docker exec ecom-api-1 printenv Storage__PublicBaseUrl 2>/dev/null)
echo "R2 Public URL: $R2_URL"
echo "Storage Base URL: $STORAGE_URL"
echo ""
echo "--- Gorsel URL ornek response suresi ---"
if [ -n "$R2_URL" ]; then
    SAMPLE=$(docker exec ecom-postgres-1 psql -U ecom -d EcomDb -t -c "SELECT image_url FROM product_images WHERE image_url IS NOT NULL LIMIT 1;" 2>/dev/null | tr -d " ")
    echo "Sample image URL: $SAMPLE"
    if [ -n "$SAMPLE" ]; then
        curl -sI --max-time 10 "$SAMPLE" -w "time_total=%{time_total}s http=%{http_code}\n" -o /dev/null 2>/dev/null
    fi
fi
''')
print(out)

print("=" * 60)
print("7. CUSTOMER LOGS (son 30 satir)")
print("=" * 60)
out, _ = run(client, 'docker logs --tail 30 ecom-customer-1 2>&1')
print(out)

print("=" * 60)
print("8. API LOGS (warn/error, son 20)")
print("=" * 60)
out, _ = run(client, 'docker logs --tail 100 ecom-api-1 2>&1 | grep -iE "warn|error|slow|timeout|exception|critical" | tail -20')
print(out)

print("=" * 60)
print("9. SUNUCU YUKU")
print("=" * 60)
out, _ = run(client, '''
uptime
free -h
df -h / | tail -1
echo "--- Top 5 CPU ---"
ps aux --sort=-%cpu | head -6
''')
print(out)

print("=" * 60)
print("10. NGINX ACCESS LOG (yavas istekler)")
print("=" * 60)
out, _ = run(client, '''
LOGFILE=/var/log/nginx/access.log
if [ -f "$LOGFILE" ]; then
    echo "Son 20 istek:"
    tail -20 "$LOGFILE"
else
    echo "Log: $LOGFILE bulunamadi"
    ls /var/log/nginx/ 2>/dev/null
fi
''')
print(out[:3000])

client.close()
print("\nDiagnostik tamamlandi.")
