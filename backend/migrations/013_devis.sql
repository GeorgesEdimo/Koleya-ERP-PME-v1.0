-- =============================================
-- Migration 013 : Devis + TVA/Remise sur lignes factures
-- Phase 1 + 2
-- =============================================

-- Colonnes TVA/remise sur les lignes de facture/devis
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS taux_tva DECIMAL(5,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS remise_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS montant_ht DECIMAL(15,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS montant_ttc DECIMAL(15,2) DEFAULT 0;

-- Colonnes totaux/remise/devise/template sur la facture/devis
ALTER TABLE factures ADD COLUMN IF NOT EXISTS remise_globale DECIMAL(5,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS total_ht DECIMAL(15,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS total_ttc DECIMAL(15,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'XAF';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS template_style VARCHAR(30) DEFAULT 'classique-bleu';

-- Colonnes specifiques document (012 existant)
-- envoye_a, commande_numero, conditions_paiement deja presents via 012_champs_documents.sql

-- Table metadonnees devis (10 types, modes de calcul, etc.)
-- NOTE: une facture de type 'devis' est stockée dans factures, d'où la FK facture_id
CREATE TABLE IF NOT EXISTS devis_meta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    type_devis VARCHAR(30) NOT NULL DEFAULT 'standard',
    mode_calcul VARCHAR(30),
    surface DECIMAL(15,2),
    taux DECIMAL(15,2),
    duree INTEGER,
    nb_intervenants INTEGER,
    mention VARCHAR(50),
    validite_jours INTEGER DEFAULT 30,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devis_meta_facture ON devis_meta(facture_id);