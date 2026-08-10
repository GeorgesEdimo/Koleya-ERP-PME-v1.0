-- =============================================
-- Koleya ERP PME — Schéma PostgreSQL
-- Multi-tenant avec isolation par entreprise_id
-- =============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENTREPRISES
-- =============================================
CREATE TABLE entreprises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(50),
    email VARCHAR(255),
    nrcc VARCHAR(100),
    logo TEXT, -- base64 ou URL
    cachet TEXT, -- base64 ou URL
    devise VARCHAR(10) DEFAULT 'FCFA',
    tva DECIMAL(5,2) DEFAULT 0,
    prefixe_facture VARCHAR(10) DEFAULT 'FAC',
    prefixe_devis VARCHAR(10) DEFAULT 'DEV',
    delai_paiement INTEGER DEFAULT 30,
    plan VARCHAR(50) DEFAULT 'starter', -- starter, pro, business
    actif BOOLEAN DEFAULT true,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- UTILISATEURS
-- =============================================
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'employe', -- proprietaire, admin, employe, comptable
    actif BOOLEAN DEFAULT true,
    derniere_connexion TIMESTAMP,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_utilisateurs_email ON utilisateurs(email);

-- =============================================
-- REFRESH TOKENS (JWT)
-- =============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_utilisateur ON refresh_tokens(utilisateur_id);

-- =============================================
-- CLIENTS
-- =============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    email VARCHAR(255),
    adresse TEXT,
    solde DECIMAL(15,2) DEFAULT 0,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clients_entreprise ON clients(entreprise_id);

-- =============================================
-- FACTURES & DEVIS
-- =============================================
CREATE TABLE factures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'facture', -- facture, devis
    statut VARCHAR(50) DEFAULT 'en_attente', -- brouillon, en_attente, payee, en_retard
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    echeance DATE,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_factures_entreprise ON factures(entreprise_id);
CREATE INDEX idx_factures_client ON factures(client_id);
CREATE INDEX idx_factures_type ON factures(type);
CREATE INDEX idx_factures_statut ON factures(statut);

-- =============================================
-- LIGNES DE FACTURE
-- =============================================
CREATE TABLE facture_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    ordre INTEGER DEFAULT 0
);

CREATE INDEX idx_facture_lignes_facture ON facture_lignes(facture_id);

-- =============================================
-- CREDITS CLIENTS
-- =============================================
CREATE TABLE credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    montant_total DECIMAL(15,2) NOT NULL,
    montant_paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) NOT NULL,
    description TEXT,
    date_vente DATE NOT NULL DEFAULT CURRENT_DATE,
    echeance DATE,
    statut VARCHAR(50) DEFAULT 'en_cours', -- en_cours, en_retard, paye
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credits_entreprise ON credits(entreprise_id);
CREATE INDEX idx_credits_client ON credits(client_id);
CREATE INDEX idx_credits_statut ON credits(statut);

-- =============================================
-- PAIEMENTS DE CREDITS
-- =============================================
CREATE TABLE credit_paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
    montant DECIMAL(15,2) NOT NULL,
    methode VARCHAR(50) DEFAULT 'especes', -- especes, mobile_money, virement
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_paiements_credit ON credit_paiements(credit_id);

-- =============================================
-- PRODUITS (STOCK)
-- =============================================
CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    reference VARCHAR(100),
    categorie VARCHAR(100),
    stock INTEGER DEFAULT 0,
    stock_min INTEGER DEFAULT 0,
    prix_achat DECIMAL(15,2) DEFAULT 0,
    prix_vente DECIMAL(15,2) DEFAULT 0,
    fournisseur VARCHAR(255),
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_produits_entreprise ON produits(entreprise_id);
CREATE INDEX idx_produits_reference ON produits(entreprise_id, reference);

-- =============================================
-- EMPLOYES
-- =============================================
CREATE TABLE employes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    poste VARCHAR(255),
    salaire DECIMAL(15,2) DEFAULT 0,
    date_embauche DATE,
    telephone VARCHAR(50),
    statut VARCHAR(50) DEFAULT 'actif', -- actif, inactif, conge
    conges_jours INTEGER DEFAULT 0,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employes_entreprise ON employes(entreprise_id);

-- =============================================
-- DEPENSES
-- =============================================
CREATE TABLE depenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    categorie VARCHAR(100) NOT NULL,
    description TEXT,
    montant DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_depenses_entreprise ON depenses(entreprise_id);
CREATE INDEX idx_depenses_date ON depenses(entreprise_id, date);

-- =============================================
-- COMPTEURS DE NUMEROS
-- =============================================
CREATE TABLE sequence_numeros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- facture, devis
    annee INTEGER NOT NULL,
    compteur INTEGER DEFAULT 0,
    UNIQUE(entreprise_id, type, annee)
);

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour générer le prochain numéro
CREATE OR REPLACE FUNCTION generer_numero(
    p_entreprise_id UUID,
    p_type VARCHAR(20)
) RETURNS VARCHAR(50) AS $$
DECLARE
    v_prefixe VARCHAR(10);
    v_annee INTEGER;
    v_compteur INTEGER;
    v_numero VARCHAR(50);
BEGIN
    v_annee := EXTRACT(YEAR FROM NOW());

    -- Récupérer le préfixe
    IF p_type = 'devis' THEN
        SELECT prefixe_devis INTO v_prefixe FROM entreprises WHERE id = p_entreprise_id;
    ELSE
        SELECT prefixe_facture INTO v_prefixe FROM entreprises WHERE id = p_entreprise_id;
    END IF;

    IF v_prefixe IS NULL THEN v_prefixe := 'FAC'; END IF;

    -- Incrémenter le compteur
    INSERT INTO sequence_numeros (entreprise_id, type, annee, compteur)
    VALUES (p_entreprise_id, p_type, v_annee, 1)
    ON CONFLICT (entreprise_id, type, annee)
    DO UPDATE SET compteur = sequence_numeros.compteur + 1
    RETURNING compteur INTO v_compteur;

    v_numero := v_prefixe || '-' || v_annee || '-' || LPAD(v_compteur::TEXT, 3, '0');
    RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue synthétique des factures avec info client
CREATE OR REPLACE VIEW v_factures AS
SELECT
    f.*,
    c.nom AS client_nom,
    c.telephone AS client_telephone,
    c.email AS client_email
FROM factures f
JOIN clients c ON f.client_id = c.id;

-- Vue des crédits en retard
CREATE OR REPLACE VIEW v_credits_en_retard AS
SELECT
    cr.*,
    cl.nom AS client_nom,
    cl.telephone AS client_telephone
FROM credits cr
JOIN clients cl ON cr.client_id = cl.id
WHERE cr.statut = 'en_retard'
   OR (cr.statut = 'en_cours' AND cr.echeance < CURRENT_DATE);

-- Vue des alertes stock
CREATE OR REPLACE VIEW v_alertes_stock AS
SELECT *
FROM produits
WHERE stock <= stock_min
ORDER BY (stock_min - stock) DESC;
