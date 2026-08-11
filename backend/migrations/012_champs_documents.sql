-- =============================================
-- Champs manquants pour les documents
-- Envoye a, Commande n°, Taxes, Signature, Email
-- =============================================

-- Ajouter aux factures
ALTER TABLE factures ADD COLUMN IF NOT EXISTS envoye_a TEXT;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS commande_numero VARCHAR(100);
ALTER TABLE factures ADD COLUMN IF NOT EXISTS conditions_paiement TEXT DEFAULT 'Paiement a 15 jours reception de la facture.';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS envoye_par_email BOOLEAN DEFAULT false;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS date_envoi_email TIMESTAMP;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS template_style VARCHAR(50) DEFAULT 'classique-bleu';

-- Ajouter aux ventes
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS envoye_a TEXT;
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS commande_numero VARCHAR(100);
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS conditions_paiement TEXT DEFAULT 'Payable comptant';
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS template_style VARCHAR(50) DEFAULT 'classique-bleu';

-- Ajouter aux achats
ALTER TABLE achats ADD COLUMN IF NOT EXISTS envoye_a TEXT;
ALTER TABLE achats ADD COLUMN IF NOT EXISTS commande_numero VARCHAR(100);
ALTER TABLE achats ADD COLUMN IF NOT EXISTS conditions_paiement TEXT DEFAULT 'Facultatif';
ALTER TABLE achats ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE achats ADD COLUMN IF NOT EXISTS template_style VARCHAR(50) DEFAULT 'classique-bleu';

-- Table des taxes par article
CREATE TABLE IF NOT EXISTS article_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
    vente_id UUID REFERENCES ventes(id) ON DELETE CASCADE,
    achat_id UUID REFERENCES achats(id) ON DELETE CASCADE,
    taux DECIMAL(5,2) NOT NULL,
    libelle VARCHAR(100) DEFAULT 'TVA',
    montant DECIMAL(15,2) NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_article_taxes_facture ON article_taxes(facture_id);

-- Historique des envois email
CREATE TABLE IF NOT EXISTS email_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    destinataire VARCHAR(255) NOT NULL,
    sujet VARCHAR(255) NOT NULL,
    document_type VARCHAR(30),
    document_id UUID,
    statut VARCHAR(20) DEFAULT 'envoye',
    erreur TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_email_history_entreprise ON email_history(entreprise_id);
