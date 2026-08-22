-- =============================================
-- Migration 015 : Numerotation automatique — 10 types de documents
-- Phase 1 + 2
-- =============================================

-- 1. Ajouter les colonnes prefixe a la table entreprises (10 types)
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_facture_fiscale VARCHAR(10) DEFAULT 'FIS';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_facture_proforma VARCHAR(10) DEFAULT 'PRO';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu VARCHAR(10) DEFAULT 'REC';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu_vente VARCHAR(10) DEFAULT 'REV';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu_caisse VARCHAR(10) DEFAULT 'RCA';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_note_credit VARCHAR(10) DEFAULT 'NDC';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_bon_commande VARCHAR(10) DEFAULT 'BCM';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_bon_livraison VARCHAR(10) DEFAULT 'BLV';
-- prefixe_facture et prefixe_devis existent deja dans 001_complete_schema.sql

-- 2. Fonction generer_numero etendue (mappe chaque type -> son prefixe)
CREATE OR REPLACE FUNCTION generer_numero(p_entreprise_id UUID, p_type VARCHAR(20))
RETURNS VARCHAR(50) AS $$
DECLARE
  v_prefixe VARCHAR(10);
  v_annee INTEGER;
  v_compteur INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM NOW())::INTEGER;

  -- Mapping type -> colonne prefixe
  SELECT CASE p_type
    WHEN 'facture' THEN COALESCE(prefixe_facture, 'FAC')
    WHEN 'facture_fiscale' THEN COALESCE(prefixe_facture_fiscale, 'FIS')
    WHEN 'facture_proforma' THEN COALESCE(prefixe_facture_proforma, 'PRO')
    WHEN 'recu' THEN COALESCE(prefixe_recu, 'REC')
    WHEN 'recu_vente' THEN COALESCE(prefixe_recu_vente, 'REV')
    WHEN 'recu_caisse' THEN COALESCE(prefixe_recu_caisse, 'RCA')
    WHEN 'note_credit' THEN COALESCE(prefixe_note_credit, 'NDC')
    WHEN 'bon_commande' THEN COALESCE(prefixe_bon_commande, 'BCM')
    WHEN 'bon_livraison' THEN COALESCE(prefixe_bon_livraison, 'BLV')
    WHEN 'devis' THEN COALESCE(prefixe_devis, 'DEV')
    ELSE COALESCE(prefixe_facture, 'FAC')
  END INTO v_prefixe
  FROM entreprises WHERE id = p_entreprise_id;

  -- Increment atomique du compteur (sequence_numeros a UNIQUE(entreprise_id, type, annee))
  INSERT INTO sequence_numeros (entreprise_id, type, annee, compteur)
  VALUES (p_entreprise_id, p_type, v_annee, 1)
  ON CONFLICT (entreprise_id, type, annee)
  DO UPDATE SET compteur = sequence_numeros.compteur + 1
  RETURNING compteur INTO v_compteur;

  RETURN v_prefixe || '-' || v_annee || '-' || LPAD(v_compteur::TEXT, 3, '0');
END; $$ LANGUAGE plpgsql;