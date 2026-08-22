-- =============================================
-- Migration 016 : Archivage + Historique transversaux
-- Phase 4
-- =============================================

-- 1. Archives de tous les documents generes
CREATE TABLE IF NOT EXISTS documents_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    module VARCHAR(20) NOT NULL,          -- facture, devis, rh, vente, achat
    document_id UUID NOT NULL,
    type_document VARCHAR(50),
    numero VARCHAR(50),
    pdf_url TEXT,
    variables JSONB,
    empreinte VARCHAR(64),                -- SHA256 pour integrite
    cree_par UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_archives_entreprise ON documents_archives(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_archives_module ON documents_archives(module);
CREATE INDEX IF NOT EXISTS idx_archives_type ON documents_archives(type_document);

-- 2. Historique des changements de statut
CREATE TABLE IF NOT EXISTS document_historique (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    module VARCHAR(20) NOT NULL,
    document_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,          -- creation, modification, envoi, validation, annulation
    statut_avant VARCHAR(50) DEFAULT '',
    statut_apres VARCHAR(50),
    utilisateur_id UUID,
    details TEXT,
    date TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_historique_module ON document_historique(module, document_id);
CREATE INDEX IF NOT EXISTS idx_historique_date ON document_historique(date);