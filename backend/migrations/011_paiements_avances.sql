-- =============================================
-- Paiements avances : Stripe, preuves, historique
-- =============================================

-- Ajouter des colonnes a la table paiements existante
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS facture_type VARCHAR(20) DEFAULT 'facture';
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS preuve_url TEXT;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS preuve_filename VARCHAR(255);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS supprime_par UUID;

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_paiements_stripe ON paiements(stripe_session_id);
