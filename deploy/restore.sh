#!/usr/bin/env sh
# =============================================
# Koleya — Restauration PostgreSQL (docker compose)
# Usage : ./deploy/restore.sh chemin/vers/sauvegarde.sql.gz
# ATTENTION : écrase la base existante.
# =============================================
set -e

if [ -z "$1" ]; then
  echo "Usage : ./deploy/restore.sh <fichier.sql.gz>"
  exit 1
fi

DB_USER="${DB_USER:-koleya}"
DB_NAME="${DB_NAME:-koleya}"

echo "⚠️  Restauration de '$DB_NAME' depuis $1 (écrase les données actuelles)."
echo "Continuer ? (oui/non)"
read -r REP
if [ "$REP" != "oui" ]; then
  echo "Annulé."
  exit 0
fi

gunzip -c "$1" | docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME"
echo "✅ Restauration terminée."
