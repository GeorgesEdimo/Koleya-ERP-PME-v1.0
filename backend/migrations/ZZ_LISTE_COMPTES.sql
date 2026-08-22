-- =============================================
-- KOLEYA — LISTE DE TOUS LES COMPTES (lecture seule)
-- Version minimale : uniquement les colonnes de 001_init.sql
-- (entreprises + utilisateurs de base). Robuste quel que soit l'état.
-- À exécuter dans l'éditeur SQL de Supabase.
-- Copiez/collez le résultat et renvoyez-le moi.
-- =============================================

SELECT
  e.nom    AS entreprise,
  e.plan,
  e.email  AS email_entreprise,
  u.email,
  u.nom,
  u.role,
  u.actif  AS utilisateur_actif,
  u.derniere_connexion
FROM entreprises e
JOIN utilisateurs u ON u.entreprise_id = e.id
ORDER BY e.nom, u.email;
