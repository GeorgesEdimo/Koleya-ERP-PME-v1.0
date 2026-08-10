#!/bin/sh
# =============================================
# Koleya — exécuteur de migrations (conteneur `migrate`)
# Base neuve : applique 001 → 005.
# Base existante : applique uniquement les migrations idempotentes suivantes (005+).
# Env : DB_USER, DB_NAME, PGPASSWORD
# =============================================
set -e

BASE_DEJA_FAITE=$(psql -h db -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT to_regclass('public.entreprises') IS NOT NULL")

if [ "$BASE_DEJA_FAITE" = "t" ]; then
  echo "Base déjà initialisée — migration incrémentale (005+)"
  psql -h db -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f /migrations/005_documents.sql
  echo "OK: 005_documents.sql"
  exit 0
fi

FICHIERS="001_init.sql 002_notifications.sql 003_seed_demo.sql 004_abonnements_softdelete.sql 005_documents.sql"

for f in $FICHIERS; do
  echo "== $f =="
  psql -h db -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "/migrations/$f"
  echo "OK: $f"
done
