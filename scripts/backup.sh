#!/bin/bash
# Daily PostgreSQL backup — runs via cron at 02:00 server time
# Cron setup: 0 2 * * * /var/www/flowhq/scripts/backup.sh >> /var/www/flowhq/logs/backup.log 2>&1
set -e

BACKUP_DIR="/var/www/flowhq/backups"
RETENTION_DAYS=7
DATE=$(date +%Y-%m-%d)
FILENAME="flowhq-backup-${DATE}.sql.gz"

# Load DATABASE_URL from control-plane .env if not already set
if [ -z "$DATABASE_URL" ]; then
  ENV_FILE="/var/www/flowhq/apps/control-plane/.env"
  if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | grep DATABASE_URL | xargs)
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "[$(date)] ERROR: DATABASE_URL not set. Backup aborted." >&2
  exit 1
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup → $BACKUP_DIR/$FILENAME"

# Dump and compress
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$FILENAME"

SIZE=$(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "[$(date)] Backup complete. Size: $SIZE"

# Delete backups older than RETENTION_DAYS
DELETED=$(find "$BACKUP_DIR" -name "flowhq-backup-*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] Pruned $DELETED old backup(s) (>${RETENTION_DAYS} days)"
fi

echo "[$(date)] Done."
