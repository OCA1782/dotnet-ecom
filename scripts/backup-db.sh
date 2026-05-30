#!/bin/bash
# SQL Server volume günlük yedek scripti
# Kullanım: ./scripts/backup-db.sh
# Cron: 0 3 * * * /opt/ecom/scripts/backup-db.sh >> /var/log/ecom-backup.log 2>&1

set -e

BACKUP_DIR="/opt/ecom/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ecom_db_$DATE.bak"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$DATE] Yedekleme başlıyor..."

# SQL Server container içinde backup al
docker exec ecom-db-1 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C \
  -Q "BACKUP DATABASE [EcomDb] TO DISK = '/var/opt/mssql/backup/ecom_db_${DATE}.bak' WITH FORMAT, COMPRESSION"

# Backup dosyasını host'a kopyala
docker cp "ecom-db-1:/var/opt/mssql/backup/ecom_db_${DATE}.bak" "$BACKUP_FILE"

# Container içindeki geçici backup dosyasını temizle
docker exec ecom-db-1 rm -f "/var/opt/mssql/backup/ecom_db_${DATE}.bak"

echo "[$DATE] Yedek oluşturuldu: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Eski yedekleri temizle
find "$BACKUP_DIR" -name "ecom_db_*.bak" -mtime +$KEEP_DAYS -delete
DELETED=$(find "$BACKUP_DIR" -name "ecom_db_*.bak" -mtime +$KEEP_DAYS | wc -l)
echo "[$DATE] $KEEP_DAYS günden eski yedekler temizlendi."

echo "[$DATE] Tamamlandı."
