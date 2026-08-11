#!/bin/bash
# Disk ve Docker kapasitesi izleme scripti
# Cron: 0 */6 * * * /opt/ecom/scripts/disk-monitor.sh >> /opt/ecom/logs/disk-monitor.log 2>&1

set -e

NOW=$(date '+%Y-%m-%d %H:%M:%S')
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"
LOG_DIR="/opt/ecom/logs"
STATE_DIR="/tmp/ecom-disk-monitor"
BACKUP_DIR="/opt/ecom/backups"

DISK_WARN_PCT=75
DISK_CRIT_PCT=85
BUILD_CACHE_WARN_GB=5

mkdir -p "$STATE_DIR" "$LOG_DIR"

send_telegram() {
  [ -z "$BOT_TOKEN" ] || [ -z "$CHAT_ID" ] && return
  curl -sf -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}&text=$1&parse_mode=HTML" -o /dev/null 2>/dev/null
}

# ── 1. Disk kullanim kontrolu ──────────────────────────────
DISK_PCT=$(df / | awk 'NR==2 {print int($5)}')
DISK_FREE=$(df -h / | awk 'NR==2 {print $4}')
DISK_USED=$(df -h / | awk 'NR==2 {print $3}')
DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}')

echo "[$NOW] Disk: ${DISK_PCT}% kullanim (${DISK_USED}/${DISK_TOTAL}, bos: ${DISK_FREE})"

DISK_STATE_FILE="$STATE_DIR/disk.state"
PREV_DISK=$(cat "$DISK_STATE_FILE" 2>/dev/null || echo "ok")

if [ "$DISK_PCT" -ge "$DISK_CRIT_PCT" ]; then
  echo "[$NOW] KRITIK: Disk %${DISK_PCT} dolu!"
  [ "$PREV_DISK" != "critical" ] && send_telegram "🚨 <b>Kritik Disk Dolulugu</b>%0ADisk %${DISK_PCT} dolu%0ABos: ${DISK_FREE}%0A$NOW"
  echo "critical" > "$DISK_STATE_FILE"
elif [ "$DISK_PCT" -ge "$DISK_WARN_PCT" ]; then
  echo "[$NOW] UYARI: Disk %${DISK_PCT} dolu."
  [ "$PREV_DISK" = "ok" ] && send_telegram "⚠️ <b>Disk Doluluk Uyarisi</b>%0ADisk %${DISK_PCT} dolu%0ABos: ${DISK_FREE}%0A$NOW"
  echo "warn" > "$DISK_STATE_FILE"
else
  [ "$PREV_DISK" != "ok" ] && send_telegram "✅ <b>Disk Normal</b>%0ADisk %${DISK_PCT} dolu%0A$NOW"
  echo "ok" > "$DISK_STATE_FILE"
fi

# ── 2. Docker build cache temizligi ──────────────────────
BUILD_CACHE_RAW=$(docker system df --format '{{.Type}}\t{{.Size}}\t{{.Reclaimable}}' 2>/dev/null | grep "Build Cache" | head -1)
echo "[$NOW] Docker Build Cache: $BUILD_CACHE_RAW"

# Build cache boyutu GB cinsinden (yaklasik)
BUILD_CACHE_GB=$(docker system df 2>/dev/null | awk '/Build Cache/ {
  match($4, /([0-9.]+)([A-Z]+)/, a)
  val=a[1]; unit=a[2]
  if (unit=="GB") print int(val)
  else if (unit=="MB") print 0
  else print 0
}')

if [ "${BUILD_CACHE_GB:-0}" -ge "$BUILD_CACHE_WARN_GB" ] 2>/dev/null; then
  echo "[$NOW] Build cache ${BUILD_CACHE_GB}GB -- temizleniyor..."
  docker builder prune -f --keep-storage 2GB >> "$LOG_DIR/disk-monitor.log" 2>&1
  NEW_CACHE=$(docker system df 2>/dev/null | grep "Build Cache" | awk '{print $4}')
  echo "[$NOW] Build cache temizlendi. Yeni boyut: $NEW_CACHE"
  send_telegram "🧹 <b>Docker Build Cache Temizlendi</b>%0AEski: ${BUILD_CACHE_GB}GB%0AYeni: ${NEW_CACHE}%0A$NOW"
fi

# ── 3. Eski Docker image temizligi ───────────────────────
DANGLING=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l)
if [ "$DANGLING" -gt 0 ]; then
  echo "[$NOW] $DANGLING dangling image temizleniyor..."
  docker image prune -f >> "$LOG_DIR/disk-monitor.log" 2>&1
  echo "[$NOW] Dangling image'lar temizlendi."
fi

# ── 4. Yedek dosyalar ozeti ──────────────────────────────
if [ -d "$BACKUP_DIR" ]; then
  BACKUP_COUNT=$(ls "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
  BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
  echo "[$NOW] Yedekler: $BACKUP_COUNT dosya, toplam $BACKUP_SIZE"
else
  echo "[$NOW] Yedek dizini mevcut degil: $BACKUP_DIR"
fi

# ── 5. Durum ozeti ───────────────────────────────────────
echo "[$NOW] Tamamlandi. Disk: ${DISK_PCT}%, Bos: ${DISK_FREE}"
