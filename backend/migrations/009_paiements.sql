-- =============================================
-- Paiements Mobile Money / Carte (CinetPay + Flutterwave)
-- =============================================

CREATE TABLE IF NOT EXISTS paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    montant DECIMAL(15,2) NOT NULL,
    methode VARCHAR(50) DEFAULT 'mobile_money', -- mobile_money, carte, especes, virement
    transaction_id VARCHAR(255) UNIQUE,
    provider VARCHAR(50), -- cinetpay, flutterwave
    statut VARCHAR(20) DEFAULT 'en_attente', -- en_attente, paye, echec, rembourse
    date_paiement TIMESTAMP,
    reponse_api JSONB,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paiements_entreprise ON paiements(entreprise_id);
CREATE INDEX idx_paiements_facture ON paiements(facture_id);
CREATE INDEX idx_paiements_transaction ON paiements(transaction_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);
