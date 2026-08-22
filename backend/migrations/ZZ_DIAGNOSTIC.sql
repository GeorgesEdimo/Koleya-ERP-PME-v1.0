-- =============================================
-- KOLEYA — Script de DIAGNOSTIC (lecture seule, sans effet)
-- À exécuter UNE FOIS dans l'éditeur SQL de Supabase.
-- Il liste les tables présentes + colonnes clés, pour savoir
-- lesquelles des 16 migrations ont déjà tourné.
-- Copiez/collez le résultat et renvoyez-le moi.
-- =============================================

SELECT
  t.table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name) AS nb_colonnes
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
