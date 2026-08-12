#!/bin/bash
# Sunucuda yedekleme ve monitoring cron job'larını kurar
# Kullanım: bash scripts/setup-cron.sh

BACKUP_SCRIPT="/opt/ecom/scripts/backup-db.sh"
MONITOR_SCRIPT="/opt/ecom/scripts/monitor-health.sh"
DISK_SCRIPT="/opt/ecom/scripts/disk-monitor.sh"
ENV_FILE="/opt/ecom/.env"
BACKUP_LOG="/opt/ecom/logs/backup.log"
MONITOR_LOG="/opt/ecom/logs/monitor.log"
DISK_LOG="/opt/ecom/logs/disk-monitor.log"

BACKUP_CRON="0 3 * * * export \$(grep -v '^#' $ENV_FILE | xargs) && $BACKUP_SCRIPT >> $BACKUP_LOG 2>&1"
MONITOR_CRON="*/5 * * * * export \$(grep -v '^#' $ENV_FILE | xargs) && $MONITOR_SCRIPT >> $MONITOR_LOG 2>&1"
DISK_CRON="0 */6 * * * $DISK_SCRIPT >> $DISK_LOG 2>&1"

chmod +x "$BACKUP_SCRIPT" "$MONITOR_SCRIPT" "$DISK_SCRIPT"

# Yedekleme cron
if crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
  echo "Yedekleme cron job zaten kurulu."
else
  (crontab -l 2>/dev/null; echo "$BACKUP_CRON") | crontab -
  echo "Yedekleme cron job kuruldu: Her gece 03:00."
fi

# Monitoring cron
if crontab -l 2>/dev/null | grep -q "monitor-health.sh"; then
  echo "Monitoring cron job zaten kurulu."
else
  (crontab -l 2>/dev/null; echo "$MONITOR_CRON") | crontab -
  echo "Monitoring cron job kuruldu: Her 5 dakikada bir."
fi

# Disk monitor cron
if crontab -l 2>/dev/null | grep -q "disk-monitor.sh"; then
  echo "Disk monitor cron job zaten kurulu."
else
  (crontab -l 2>/dev/null; echo "$DISK_CRON") | crontab -
  echo "Disk monitor cron job kuruldu: Her 6 saatte bir."
fi

echo ""
echo "Mevcut cron jobs:"
crontab -l
