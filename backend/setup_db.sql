-- =============================================
-- Koleya — Création du rôle et de la base (idempotent)
-- Exécuter avec le superutilisateur PostgreSQL :
--   psql -U postgres -h localhost -f backend/setup_db.sql
-- =============================================

-- Créer le rôle si absent
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'koleya') THEN
    CREATE ROLE koleya LOGIN PASSWORD 'koleya';
    RAISE NOTICE 'Role koleya cree.';
  ELSE
    RAISE NOTICE 'Role koleya deja present.';
  END IF;
END
$$;

-- Créer la base si absente
SELECT 'CREATE DATABASE koleya OWNER koleya'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'koleya')\gexec
