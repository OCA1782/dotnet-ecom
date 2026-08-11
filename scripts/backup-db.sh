#!/bin/bash
# PostgreSQL günlük yedek scripti
# Cron: 0 3 * * * /opt/ecom/scripts/backup-db.sh >> /var/log/ecom-backup.log 2>&1

set -e

BACKUP_DIR="/opt/ecom/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ecomdb_${DATE}.sql.gz"
KEEP_DAYS=7
PG_CONTAINER="ecom-postgres-1"
PG_USER="ecom"
PG_DB="EcomDb"

mkdir -p "$BACKUP_DIR"
echo "[$DATE] PostgreSQL yedekleme başlıyor: $PG_DB"

# pg_dump → gzip → host dosyası
docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" "$PG_DB" | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$DATE] Yedek oluşturuldu: $BACKUP_FILE ($SIZE)"

# 7 günden eski yedekleri sil
find "$BACKUP_DIR" -name "ecomdb_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[$DATE] $KEEP_DAYS günden eski yedekler temizlendi."
echo "[$DATE] Tamamlandı."
