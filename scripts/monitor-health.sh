#!/bin/bash
# Ecom sağlık kontrol scripti — her 5 dakikada çalışır
# API, customer frontend ve DB endpoint'lerini kontrol eder
# Durum değişikliğinde Telegram bildirimi gönderir
# Cron: */5 * * * * /opt/ecom/scripts/monitor-health.sh >> /var/log/ecom-monitor.log 2>&1

API_HEALTH_URL="${API_HEALTH_URL:-http://localhost:15124/health}"
CUSTOMER_URL="${CUSTOMER_URL:-http://localhost:13000}"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"
STATE_DIR="/tmp/ecom-monitor"
TIMEOUT=10
MAX_RETRIES=2

mkdir -p "$STATE_DIR"
NOW=$(date '+%Y-%m-%d %H:%M:%S')

send_telegram() {
  [ -z "$BOT_TOKEN" ] || [ -z "$CHAT_ID" ] && return
  curl -sf -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}&text=$1&parse_mode=HTML" -o /dev/null 2>/dev/null
}

check_http() {
  local url="$1"
  for i in $(seq 1 $MAX_RETRIES); do
    CODE=$(curl -sf --max-time $TIMEOUT -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    [ "$CODE" -ge 200 ] && [ "$CODE" -lt 500 ] && return 0
    sleep 2
  done
  return 1
}

check_endpoint() {
  local name="$1"
  local url="$2"
  local state_file="$STATE_DIR/${name}.state"
  local prev=$(cat "$state_file" 2>/dev/null || echo "ok")

  if check_http "$url"; then
    if [ "$prev" = "down" ]; then
      echo "[$NOW] ✅ $name geri döndü: $url"
      send_telegram "✅ <b>$name Geri Döndü</b>%0A$url%0A$NOW"
    fi
    echo "ok" > "$state_file"
  else
    echo "[$NOW] 🔴 $name erişilemiyor: $url"
    if [ "$prev" != "down" ]; then
      send_telegram "🚨 <b>$name Erişilemiyor</b>%0A$url%0A$NOW"
    fi
    echo "down" > "$state_file"
  fi
}

# PostgreSQL bağlantı kontrolü (container içinden)
check_postgres() {
  local state_file="$STATE_DIR/postgres.state"
  local prev=$(cat "$state_file" 2>/dev/null || echo "ok")
  if docker exec ecom-postgres-1 pg_isready -U ecom -d EcomDb -q 2>/dev/null; then
    [ "$prev" = "down" ] && send_telegram "✅ <b>PostgreSQL Geri Döndü</b>%0A$NOW"
    echo "ok" > "$state_file"
  else
    echo "[$NOW] 🔴 PostgreSQL hazır değil"
    [ "$prev" != "down" ] && send_telegram "🚨 <b>PostgreSQL Hazır Değil</b>%0A$NOW"
    echo "down" > "$state_file"
  fi
}

check_endpoint "API"      "$API_HEALTH_URL"
check_endpoint "Customer" "$CUSTOMER_URL"
check_postgres
