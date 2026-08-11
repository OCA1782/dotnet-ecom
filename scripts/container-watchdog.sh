#!/bin/bash
# Container watchdog — her dakika çalışır, unhealthy/stopped container'ları restart eder
# Cron: * * * * * /opt/ecom/scripts/container-watchdog.sh >> /var/log/ecom-watchdog.log 2>&1

COMPOSE_DIR="/opt/ecom"
LOG_FILE="/var/log/ecom-watchdog.log"
STATE_DIR="/tmp/ecom-watchdog"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"

mkdir -p "$STATE_DIR"

NOW=$(date '+%Y-%m-%d %H:%M:%S')

send_telegram() {
  [ -z "$BOT_TOKEN" ] || [ -z "$CHAT_ID" ] && return
  curl -sf -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}&text=$1&parse_mode=HTML" -o /dev/null 2>/dev/null
}

# İzlenecek container'lar ve servisleri
declare -A CONTAINERS=(
  [ecom-api-1]="api"
  [ecom-customer-1]="customer"
  [ecom-admin-1]="admin"
  [ecom-postgres-1]="postgres"
  [ecom-redis-1]="redis"
  [ecom-rabbitmq-1]="rabbitmq"
  [ecom-licence-1]="licence"
)

for CONTAINER in "${!CONTAINERS[@]}"; do
  SERVICE="${CONTAINERS[$CONTAINER]}"
  STATE_FILE="$STATE_DIR/${CONTAINER}.state"

  STATUS=$(docker inspect --format '{{.State.Status}}' "$CONTAINER" 2>/dev/null)
  HEALTH=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER" 2>/dev/null)

  # Container çalışmıyor
  if [ "$STATUS" != "running" ]; then
    echo "[$NOW] ⚠ $CONTAINER STATUS=$STATUS — yeniden başlatılıyor..."
    cd "$COMPOSE_DIR" && docker compose up -d --no-deps "$SERVICE" >> "$LOG_FILE" 2>&1
    send_telegram "⚠️ <b>$CONTAINER yeniden başlatıldı</b>%0AStatus: $STATUS%0A$NOW"
    echo "restarted" > "$STATE_FILE"
    continue
  fi

  # Container unhealthy
  if [ "$HEALTH" = "unhealthy" ]; then
    PREV=$(cat "$STATE_FILE" 2>/dev/null)
    echo "[$NOW] 🔴 $CONTAINER UNHEALTHY — yeniden başlatılıyor..."
    docker restart "$CONTAINER" >> "$LOG_FILE" 2>&1
    if [ "$PREV" != "unhealthy" ]; then
      send_telegram "🔴 <b>$CONTAINER unhealthy</b>%0AYeniden başlatıldı.%0A$NOW"
    fi
    echo "unhealthy" > "$STATE_FILE"
    continue
  fi

  # Customer container için api DNS kontrolü
  if [ "$CONTAINER" = "ecom-customer-1" ] && [ "$STATUS" = "running" ]; then
    API_CHECK=$(docker exec "$CONTAINER" wget -qO- --timeout=3 http://api:8080/health 2>&1)
    if echo "$API_CHECK" | grep -q "bad address"; then
      echo "[$NOW] ⚠ $CONTAINER api DNS çözemiyor — hosts düzeltiliyor..."
      API_IP=$(docker inspect ecom-api-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null | tr ' ' '\n' | grep -v '^$' | tail -1)
      if [ -n "$API_IP" ]; then
        # Container'ı --add-host ile yeniden oluştur
        ENVS=$(docker inspect "$CONTAINER" --format '{{range .Config.Env}}-e {{.}} {{end}}' 2>/dev/null)
        PORTS=$(docker inspect "$CONTAINER" --format '{{range $p,$b := .HostConfig.PortBindings}}-p {{(index $b 0).HostIp}}:{{(index $b 0).HostPort}}:{{$p}} {{end}}' 2>/dev/null)
        docker stop "$CONTAINER" && docker rm "$CONTAINER"
        docker run -d --name "$CONTAINER" --network ecom_default \
          --add-host "api:$API_IP" \
          $PORTS $ENVS \
          --restart unless-stopped \
          ecom-customer:latest
        send_telegram "🔧 <b>Customer API DNS düzeltildi</b>%0AAPI IP: $API_IP%0A$NOW"
        echo "[$NOW] Customer api:$API_IP ile yeniden oluşturuldu."
      fi
    fi
  fi

  # Durum iyileştiyse bildiri gönder
  PREV=$(cat "$STATE_FILE" 2>/dev/null)
  if [ "$PREV" = "unhealthy" ] || [ "$PREV" = "restarted" ]; then
    echo "[$NOW] ✅ $CONTAINER healthy/running durumuna döndü."
    send_telegram "✅ <b>$CONTAINER normal duruma döndü</b>%0A$NOW"
    echo "ok" > "$STATE_FILE"
  fi

done
