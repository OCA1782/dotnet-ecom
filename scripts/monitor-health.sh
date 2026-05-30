#!/bin/bash
# Ecom sağlık kontrol scripti — her çalışmada /health endpoint kontrol eder
# Durum değişikliğinde (ok→down veya down→ok) Telegram bildirimi gönderir
# Cron: */5 * * * * /opt/ecom/scripts/monitor-health.sh >> /var/log/ecom-monitor.log 2>&1

HEALTH_URL="${HEALTH_URL:-http://localhost:5124/health}"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"
STATE_FILE="/tmp/ecom_health_state"
LOG_FILE="/var/log/ecom-monitor.log"
MAX_RETRIES=3
TIMEOUT=10

check_health() {
  for i in $(seq 1 $MAX_RETRIES); do
    STATUS=$(curl -sf --max-time $TIMEOUT "$HEALTH_URL" -o /dev/null -w "%{http_code}" 2>/dev/null)
    [ "$STATUS" = "200" ] && return 0
    sleep 2
  done
  return 1
}

send_telegram() {
  local msg="$1"
  [ -z "$BOT_TOKEN" ] || [ -z "$CHAT_ID" ] && return
  curl -sf -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}&text=${msg}&parse_mode=HTML" \
    -o /dev/null 2>/dev/null
}

NOW=$(date '+%Y-%m-%d %H:%M:%S')
PREV_STATE=$(cat "$STATE_FILE" 2>/dev/null || echo "ok")

if check_health; then
  if [ "$PREV_STATE" = "down" ]; then
    echo "ok" > "$STATE_FILE"
    send_telegram "✅ <b>Ecom API Geri Döndü</b>%0A${HEALTH_URL}%0A${NOW}"
    echo "[$NOW] RECOVERED: $HEALTH_URL"
  fi
else
  echo "down" > "$STATE_FILE"
  echo "[$NOW] DOWN: $HEALTH_URL" | tee -a "$LOG_FILE"
  if [ "$PREV_STATE" != "down" ]; then
    send_telegram "🚨 <b>Ecom API Erişilemez</b>%0AHealth check başarısız: ${HEALTH_URL}%0A${NOW}"
  fi
  exit 1
fi
