#!/usr/bin/env sh
# =============================================
# Koleya — Sauvegarde PostgreSQL (docker compose)
# Usage : ./deploy/backup.sh [répertoire_de_sortie]
# Produit : <sortie>/koleya_backup_AAAA-MM-JJ_HHMMSS.sql.gz
# =============================================
set -e

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"

STAMP=$(date +%Y-%m-%d_%H%M%S)
FILE="$OUT_DIR/koleya_backup_$STAMP.sql.gz"

DB_USER="${DB_USER:-koleya}"
DB_NAME="${DB_NAME:-koleya}"

echo "Sauvegarde de la base '$DB_NAME' vers $FILE …"
docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$FILE"

echo "✅ Sauvegarde terminée : $FILE"
echo "Conservation conseillée : rotation (ex : garder les 14 derniers, copier vers un stockage distant)."
