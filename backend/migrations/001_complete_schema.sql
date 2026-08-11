-- =============================================
-- KOLEYA ERP PME — Schema PostgreSQL Unifie
-- Version 2.0 — Production
-- =============================================

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
    logo TEXT,
    cachet TEXT,
    devise VARCHAR(10) DEFAULT 'FCFA',
    tva DECIMAL(5,2) DEFAULT 0,
    prefixe_facture VARCHAR(10) DEFAULT 'FAC',
    prefixe_devis VARCHAR(10) DEFAULT 'DEV',
    delai_paiement INTEGER DEFAULT 30,
    plan VARCHAR(50) DEFAULT 'starter',
    essai_active BOOLEAN DEFAULT true,
    essai_fin TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    actif BOOLEAN DEFAULT true,
    pays_code VARCHAR(5) DEFAULT 'CM',
    langue VARCHAR(10) DEFAULT 'fr',
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- UTILISATEURS
-- =============================================
CREATE TABLE utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'employe',
    est_super_admin BOOLEAN DEFAULT false,
    actif BOOLEAN DEFAULT true,
    derniere_connexion TIMESTAMP,
    cree_le TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- REFRESH TOKENS
-- =============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(utilisateur_id);

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
    ville VARCHAR(100),
    pays_code VARCHAR(5) DEFAULT 'CM',
    solde DECIMAL(15,2) DEFAULT 0,
    supprime_le TIMESTAMP,
    supprime_par UUID,
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
    type VARCHAR(20) NOT NULL DEFAULT 'facture',
    statut VARCHAR(50) DEFAULT 'en_attente',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    echeance DATE,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    supprime_le TIMESTAMP,
    supprime_par UUID,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_factures_entreprise ON factures(entreprise_id);
CREATE INDEX idx_factures_client ON factures(client_id);
CREATE INDEX idx_factures_type_statut ON factures(type, statut);

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
-- VENTES (module nouveau)
-- =============================================
CREATE TABLE ventes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    numero VARCHAR(50) NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_cours',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode_paiement VARCHAR(50) DEFAULT 'especes',
    montant_total DECIMAL(15,2) NOT NULL DEFAULT 0,
    remise DECIMAL(15,2) DEFAULT 0,
    montant_final DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    supprime_le TIMESTAMP,
    supprime_par UUID,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_ventes_entreprise ON ventes(entreprise_id);
CREATE INDEX idx_ventes_client ON ventes(client_id);
CREATE INDEX idx_ventes_date ON ventes(date);

CREATE TABLE vente_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vente_id UUID NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES produits(id),
    description VARCHAR(500) NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
    remise DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    ordre INTEGER DEFAULT 0
);
CREATE INDEX idx_vente_lignes_vente ON vente_lignes(vente_id);

-- =============================================
-- ACHATS (module nouveau)
-- =============================================
CREATE TABLE achats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    fournisseur VARCHAR(255),
    numero VARCHAR(50) NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_cours',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode_paiement VARCHAR(50) DEFAULT 'especes',
    montant_total DECIMAL(15,2) NOT NULL DEFAULT 0,
    remise DECIMAL(15,2) DEFAULT 0,
    montant_final DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    supprime_le TIMESTAMP,
    supprime_par UUID,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_achats_entreprise ON achats(entreprise_id);
CREATE INDEX idx_achats_date ON achats(date);

CREATE TABLE achat_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    achat_id UUID NOT NULL REFERENCES achats(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES produits(id),
    description VARCHAR(500) NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0,
    remise DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    ordre INTEGER DEFAULT 0
);
CREATE INDEX idx_achat_lignes_achat ON achat_lignes(achat_id);

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
    statut VARCHAR(50) DEFAULT 'en_cours',
    supprime_le TIMESTAMP,
    supprime_par UUID,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_credits_entreprise ON credits(entreprise_id);

CREATE TABLE credit_paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
    montant DECIMAL(15,2) NOT NULL,
    methode VARCHAR(50) DEFAULT 'especes',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- PRODUITS
-- =============================================
CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    reference VARCHAR(100),
    code_barres VARCHAR(100),
    categorie VARCHAR(100),
    unite VARCHAR(20) DEFAULT 'unite',
    stock INTEGER DEFAULT 0,
    stock_min INTEGER DEFAULT 0,
    prix_achat DECIMAL(15,2) DEFAULT 0,
    prix_vente DECIMAL(15,2) DEFAULT 0,
    fournisseur VARCHAR(255),
    emplacement VARCHAR(100),
    supprime_le TIMESTAMP,
    supprime_par UUID,
    cree_le TIMESTAMP DEFAULT NOW(),
    mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_produits_entreprise ON produits(entreprise_id);
CREATE INDEX idx_produits_reference ON produits(entreprise_id, reference);

-- =============================================
-- MOUVEMENTS DE STOCK
-- =============================================
CREATE TABLE mouvements_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    type_mouvement VARCHAR(30) NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_avant INTEGER,
    quantite_apres INTEGER,
    prix_unitaire DECIMAL(15,2),
    motif TEXT,
    reference VARCHAR(100),
    utilisateur VARCHAR(255),
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_mouvements_entreprise ON mouvements_stock(entreprise_id);
CREATE INDEX idx_mouvements_date ON mouvements_stock(cree_le DESC);

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
    statut VARCHAR(50) DEFAULT 'actif',
    conges_jours INTEGER DEFAULT 0,
    supprime_le TIMESTAMP,
    supprime_par UUID,
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
    supprime_le TIMESTAMP,
    supprime_par UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_depenses_entreprise ON depenses(entreprise_id);
CREATE INDEX idx_depenses_date ON depenses(entreprise_id, date);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    canal VARCHAR(20) DEFAULT 'sms',
    destinataire VARCHAR(255) NOT NULL,
    destinataire_nom VARCHAR(255),
    sujet VARCHAR(255),
    message TEXT NOT NULL,
    statut VARCHAR(20) DEFAULT 'en_attente',
    type_source VARCHAR(50),
    source_id UUID,
    date_envoi TIMESTAMP,
    reponse_api TEXT,
    erreur TEXT,
    supprime_le TIMESTAMP,
    supprime_par UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_notifications_entreprise ON notifications(entreprise_id);

-- =============================================
-- PAIEMENTS
-- =============================================
CREATE TABLE paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    facture_id UUID REFERENCES factures(id),
    montant DECIMAL(15,2) NOT NULL,
    methode VARCHAR(50) DEFAULT 'mobile_money',
    transaction_id VARCHAR(255) UNIQUE,
    provider VARCHAR(50),
    statut VARCHAR(20) DEFAULT 'en_attente',
    date_paiement TIMESTAMP,
    reponse_api JSONB,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_paiements_entreprise ON paiements(entreprise_id);

-- =============================================
-- SEQUENCE NUMEROS
-- =============================================
CREATE TABLE sequence_numeros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    annee INTEGER NOT NULL,
    compteur INTEGER DEFAULT 0,
    UNIQUE(entreprise_id, type, annee)
);

-- =============================================
-- ABONNEMENTS
-- =============================================
CREATE TABLE abonnements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE UNIQUE,
    plan VARCHAR(50) DEFAULT 'starter',
    statut VARCHAR(20) DEFAULT 'essai',
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    prix_mensuel DECIMAL(10,2) DEFAULT 0,
    cree_le TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================
CREATE OR REPLACE FUNCTION generer_numero(p_entreprise_id UUID, p_type VARCHAR(20))
RETURNS VARCHAR(50) AS $$
DECLARE
    v_prefixe VARCHAR(10);
    v_annee INTEGER;
    v_compteur INTEGER;
BEGIN
    v_annee := EXTRACT(YEAR FROM NOW())::INTEGER;
    IF p_type = 'devis' THEN
        SELECT prefixe_devis INTO v_prefixe FROM entreprises WHERE id = p_entreprise_id;
    ELSE
        SELECT prefixe_facture INTO v_prefixe FROM entreprises WHERE id = p_entreprise_id;
    END IF;
    IF v_prefixe IS NULL THEN v_prefixe := 'FAC'; END IF;
    INSERT INTO sequence_numeros (entreprise_id, type, annee, compteur)
    VALUES (p_entreprise_id, p_type, v_annee, 1)
    ON CONFLICT (entreprise_id, type, annee)
    DO UPDATE SET compteur = sequence_numeros.compteur + 1
    RETURNING compteur INTO v_compteur;
    RETURN v_prefixe || '-' || v_annee || '-' || LPAD(v_compteur::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SEED DEMO
-- =============================================
INSERT INTO entreprises (nom, telephone, email, plan, essai_active, essai_fin)
VALUES ('Koleya Demo', '+237600000000', 'demo@koleya.cm', 'business', false, NULL)
ON CONFLICT DO NOTHING;

-- Compte super admin
INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role, est_super_admin)
SELECT id, 'superadmin@koleya.cm', '$2a$12$LJ3m4ys3Pz0KjXvUe0bOzuhHnVcLpGx9kR2FqN4dM5hS7gT8uI0y', 'Super Admin', '+237600000000', 'proprietaire', true
FROM entreprises WHERE email = 'demo@koleya.cm'
ON CONFLICT (email) DO NOTHING;

-- Compte demo
INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role)
SELECT id, 'admin@koleya.com', '$2a$12$LJ3m4ys3Pz0KjXvUe0bOzuhHnVcLpGx9kR2FqN4dM5hS7gT8uI0y', 'Admin Demo', '+237690000000', 'proprietaire'
FROM entreprises WHERE email = 'demo@koleya.cm'
ON CONFLICT (email) DO NOTHING;

-- Clients de demo
INSERT INTO clients (entreprise_id, nom, telephone, email, adresse)
SELECT id, 'Entreprise Kamga', '+237691234567', 'kamga@email.com', 'Bonanjo, Douala'
FROM entreprises WHERE email = 'demo@koleya.cm';

INSERT INTO clients (entreprise_id, nom, telephone, email, adresse)
SELECT id, 'Boutique Ngo Biyick', '+237677890123', '', 'Marche Central, Douala'
FROM entreprises WHERE email = 'demo@koleya.cm';

INSERT INTO clients (entreprise_id, nom, telephone, email, adresse)
SELECT id, 'SPAR Makeda', '+237655456789', 'info@makeeda.cm', 'Bonapriso, Douala'
FROM entreprises WHERE email = 'demo@koleya.cm';

-- Produits de demo
INSERT INTO produits (entreprise_id, nom, reference, categorie, stock, stock_min, prix_achat, prix_vente, fournisseur)
SELECT id, 'Papier A4 (ramette)', 'PAP-A4-001', 'Fournitures', 150, 20, 1500, 2500, 'Cameroun Papeterie'
FROM entreprises WHERE email = 'demo@koleya.cm';

INSERT INTO produits (entreprise_id, nom, reference, categorie, stock, stock_min, prix_achat, prix_vente, fournisseur)
SELECT id, 'Cartouche HP', 'ENR-HP-001', 'Informatique', 8, 10, 12000, 18000, 'Tech Supply'
FROM entreprises WHERE email = 'demo@koleya.cm';

INSERT INTO produits (entreprise_id, nom, reference, categorie, stock, stock_min, prix_achat, prix_vente, fournisseur)
SELECT id, 'Cle USB 32Go', 'USB-32-001', 'Informatique', 45, 15, 3000, 5500, 'Tech Supply'
FROM entreprises WHERE email = 'demo@koleya.cm';

-- Employes de demo
INSERT INTO employes (entreprise_id, nom, poste, salaire, date_embauche, telephone)
SELECT id, 'Mbarga Jean', 'Technicien', 150000, '2025-06-01', '+237699111222'
FROM entreprises WHERE email = 'demo@koleya.cm';

INSERT INTO employes (entreprise_id, nom, poste, salaire, date_embauche, telephone)
SELECT id, 'Nkoulou Marie', 'Comptable', 200000, '2025-03-15', '+237677333444'
FROM entreprises WHERE email = 'demo@koleya.cm';

-- Pays supportes
INSERT INTO pays (code, nom, devise, symbole_devise, fuseau, prefixe_telephone) VALUES
('CM', 'Cameroun', 'XAF', 'FCFA', 'Africa/Douala', '+237'),
('GA', 'Gabon', 'XAF', 'FCFA', 'Africa/Libreville', '+241'),
('CG', 'Congo', 'XAF', 'FCFA', 'Africa/Brazzaville', '+242'),
('CI', 'Cote d''Ivoire', 'XOF', 'FCFA', 'Africa/Abidjan', '+225'),
('SN', 'Senegal', 'XOF', 'FCFA', 'Africa/Dakar', '+221'),
('NG', 'Nigeria', 'NGN', '₦', 'Africa/Lagos', '+234')
ON CONFLICT (code) DO NOTHING;
