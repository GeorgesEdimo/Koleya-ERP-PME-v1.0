-- =============================================
-- Comptabilite complete : plan comptable, ecritures, TVA
-- =============================================

-- PLAN COMPTABLE (simplifie pour PME africaines)
CREATE TABLE IF NOT EXISTS comptes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    numero VARCHAR(20) NOT NULL,
    intitule VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- actif, passif, charge, produit
    classe INTEGER NOT NULL, -- 1=actif, 2=passif, 6=charges, 7=produits
    parent_id UUID REFERENCES comptes(id),
    actif BOOLEAN DEFAULT true,
    cree_le TIMESTAMP DEFAULT NOW(),
    UNIQUE(entreprise_id, numero)
);
CREATE INDEX idx_comptes_entreprise ON comptes(entreprise_id);
CREATE INDEX idx_comptes_classe ON comptes(classe);

-- ECRITURES COMPTABLES
CREATE TABLE IF NOT EXISTS ecritures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    journal VARCHAR(10) NOT NULL, -- VE (ventes), AC (achats), BQ (banque), OD (divers)
    numero INTEGER NOT NULL,
    date DATE NOT NULL,
    libelle TEXT NOT NULL,
    reference VARCHAR(100),
    source_type VARCHAR(30), -- facture, depense, virement
    source_id UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_ecritures_entreprise ON ecritures(entreprise_id);
CREATE INDEX idx_ecritures_date ON ecritures(date);
CREATE INDEX idx_ecritures_journal ON ecritures(journal);

-- LIGNES D'ECRITURE (double entree)
CREATE TABLE IF NOT EXISTS ecriture_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ecriture_id UUID NOT NULL REFERENCES ecritures(id) ON DELETE CASCADE,
    compte_id UUID NOT NULL REFERENCES comptes(id),
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    ordre INTEGER DEFAULT 0
);
CREATE INDEX idx_ecriture_lignes_ecriture ON ecriture_lignes(ecriture_id);
CREATE INDEX idx_ecriture_lignes_compte ON ecriture_lignes(compte_id);

-- TVA
CREATE TABLE IF NOT EXISTS tva_regimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    taux DECIMAL(5,2) NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    actif BOOLEAN DEFAULT true
);

-- DECLARATIONS TVA
CREATE TABLE IF NOT EXISTS declarations_tva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    periode_debut DATE NOT NULL,
    periode_fin DATE NOT NULL,
    ca_ht DECIMAL(15,2) DEFAULT 0,
    tva_collectee DECIMAL(15,2) DEFAULT 0,
    tva_deductible DECIMAL(15,2) DEFAULT 0,
    tva_a_payer DECIMAL(15,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'brouillon', -- brouillon, validee, payee
    date_declaration DATE,
    date_paiement DATE,
    cree_le TIMESTAMP DEFAULT NOW()
);

-- Plan comptable par defaut pour les PME camerounaises
-- (insere lors de la creation d'une entreprise)
