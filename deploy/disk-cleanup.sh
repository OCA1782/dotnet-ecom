#!/bin/bash
# disk-cleanup.sh — Disk ve PostgreSQL alan kontrolü; kritik seviyede temizlik yapar.
# Çalışma: cron — 23:00, 03:00, 06:00
# Eşik  : %80 doluluk → temizlik başlar (1 günden eski kayıtlar silinir)

set -euo pipefail

THRESHOLD=80
LOG_FILE="/opt/ecom/logs/disk-cleanup.log"
COMPOSE_DIR="/opt/ecom"
PG_CONTAINER="ecom-postgres-1"
PG_USER="ecom"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# ── Disk kullanım yüzdesi ──────────────────────────────────────────────────
DISK_USAGE=$(df / --output=pcent | tail -1 | tr -d ' %')
log "Disk kullanımı: ${DISK_USAGE}%"

# ── PostgreSQL data dizini boyutu ──────────────────────────────────────────
PG_DATA_SIZE=$(docker exec "$PG_CONTAINER" du -sh /var/lib/postgresql/data 2>/dev/null | cut -f1 || echo "bilinmiyor")
log "PostgreSQL veri dizini: ${PG_DATA_SIZE}"

if [ "$DISK_USAGE" -lt "$THRESHOLD" ]; then
    log "Disk kullanımı eşik altında (${DISK_USAGE}% < ${THRESHOLD}%). Temizlik gerekmez."
    exit 0
fi

log "⚠️  KRİTİK: Disk ${DISK_USAGE}% dolu. Temizlik başlıyor..."
CLEANED=0

# ── Nginx logları (1 günden eski) ──────────────────────────────────────────
if [ -d /var/log/nginx ]; then
    BEFORE=$(du -sh /var/log/nginx 2>/dev/null | cut -f1)
    find /var/log/nginx -name "*.log*" -mtime +1 -delete 2>/dev/null || true
    # Aktif log dosyasını kısalt (truncate — inode değişmez, nginx yazmaya devam eder)
    for f in /var/log/nginx/access.log /var/log/nginx/error.log; do
        [ -f "$f" ] && truncate -s 0 "$f" && log "  Kısaltıldı: $f"
    done
    AFTER=$(du -sh /var/log/nginx 2>/dev/null | cut -f1)
    log "  Nginx logları: ${BEFORE} → ${AFTER}"
    CLEANED=$((CLEANED + 1))
fi

# ── Systemd journal (1 günden eski) ───────────────────────────────────────
JOURNAL_BEFORE=$(journalctl --disk-usage 2>/dev/null | grep -oP '\d+(\.\d+)?\s*[KMGTP]B' | head -1 || echo "bilinmiyor")
journalctl --vacuum-time=1d 2>/dev/null || true
JOURNAL_AFTER=$(journalctl --disk-usage 2>/dev/null | grep -oP '\d+(\.\d+)?\s*[KMGTP]B' | head -1 || echo "bilinmiyor")
log "  Journal: ${JOURNAL_BEFORE} → ${JOURNAL_AFTER}"
CLEANED=$((CLEANED + 1))

# ── Docker build cache ─────────────────────────────────────────────────────
DOCKER_CACHE_BEFORE=$(docker system df --format '{{.BuildCacheSize}}' 2>/dev/null | head -1 || echo "bilinmiyor")
docker builder prune -f 2>/dev/null || true
DOCKER_CACHE_AFTER=$(docker system df --format '{{.BuildCacheSize}}' 2>/dev/null | head -1 || echo "bilinmiyor")
log "  Docker build cache: ${DOCKER_CACHE_BEFORE} → ${DOCKER_CACHE_AFTER}"
CLEANED=$((CLEANED + 1))

# ── PostgreSQL log dosyaları (container içi, 1 günden eski) ───────────────
PG_LOG_DIR=$(docker exec "$PG_CONTAINER" bash -c \
    'psql -U '"$PG_USER"' -d EcomDb -tAc "SHOW log_directory"' 2>/dev/null || echo "")
if [ -n "$PG_LOG_DIR" ] && [ "$PG_LOG_DIR" != "log_directory" ]; then
    docker exec "$PG_CONTAINER" bash -c \
        "find ${PG_LOG_DIR} -name '*.log' -mtime +1 -delete 2>/dev/null || true" 2>/dev/null || true
    log "  PostgreSQL logları temizlendi (${PG_LOG_DIR})"
    CLEANED=$((CLEANED + 1))
fi

# ── Uygulama upload/temp dosyaları (isteğe bağlı) ─────────────────────────
# find /tmp -name "*.tmp" -mtime +1 -delete 2>/dev/null || true

# ── Temizlik sonrası disk durumu ──────────────────────────────────────────
DISK_AFTER=$(df / --output=pcent | tail -1 | tr -d ' %')
log "✅ Temizlik tamamlandı. ${CLEANED} alan temizlendi. Disk: ${DISK_USAGE}% → ${DISK_AFTER}%"

exit 0
