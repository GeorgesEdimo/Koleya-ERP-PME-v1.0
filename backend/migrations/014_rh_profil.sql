-- =============================================
-- Migration 014 : RH — Profil employe + documents + structures
-- Phase 3
-- =============================================

-- 1. Enrichir la table employes (~20 colonnes)
ALTER TABLE employes ADD COLUMN IF NOT EXISTS matricule VARCHAR(50);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS civilite VARCHAR(10);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS prenom VARCHAR(100);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS nom_usage VARCHAR(255);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR(255);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS nationalite VARCHAR(100);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS num_secu VARCHAR(50);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS situation_familiale VARCHAR(50);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS nb_enfants INTEGER DEFAULT 0;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS iban VARCHAR(50);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS bic VARCHAR(20);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS contact_urgence VARCHAR(255);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS lien_parente VARCHAR(50);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS tel_urgence VARCHAR(50);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS manager_n1 VARCHAR(255);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS site_travail VARCHAR(255);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS email_pro VARCHAR(255);
ALTER TABLE employes ADD COLUMN IF NOT EXISTS telephone_pro VARCHAR(50);

-- 2. Table des documents RH generes (14 types)
CREATE TABLE IF NOT EXISTS rh_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    type_document VARCHAR(50) NOT NULL,
    titre TEXT,
    variables JSONB,
    pdf_url TEXT,
    statut VARCHAR(20) DEFAULT 'brouillon',
    cree_par UUID,
    cree_le TIMESTAMP DEFAULT NOW(),
    supprime_le TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rh_docs_entreprise ON rh_documents(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_rh_docs_employe ON rh_documents(employe_id);
CREATE INDEX IF NOT EXISTS idx_rh_docs_type ON rh_documents(type_document);

-- 3. Ordres de mission
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    objet TEXT,
    destination TEXT,
    date_debut DATE,
    date_fin DATE,
    motif TEXT,
    moyen_transport VARCHAR(100),
    statut VARCHAR(20) DEFAULT 'brouillon',
    approuve_par UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_missions_employe ON missions(employe_id);

-- 4. Notes de frais
CREATE TABLE IF NOT EXISTS notes_frais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date_soumission DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'en_attente',
    total DECIMAL(15,2) DEFAULT 0,
    approuve_par UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes_frais_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_frais_id UUID NOT NULL REFERENCES notes_frais(id) ON DELETE CASCADE,
    date_frais DATE,
    categorie VARCHAR(100),
    description TEXT,
    montant DECIMAL(15,2) NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_frais_lignes_note ON notes_frais_lignes(note_frais_id);

-- 5. Visites medicales
CREATE TABLE IF NOT EXISTS visites_medicales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date_visite DATE,
    centre_medical VARCHAR(255),
    medecin VARCHAR(255),
    aptitude VARCHAR(50),
    restrictions TEXT,
    prochaine_visite DATE,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visites_employe ON visites_medicales(employe_id);

-- 6. Materiel mis a disposition
CREATE TABLE IF NOT EXISTS materiel_employe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date_mise_a_disposition DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'actif',
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materiel_employe_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materiel_id UUID NOT NULL REFERENCES materiel_employe(id) ON DELETE CASCADE,
    type_materiel VARCHAR(100),
    marque VARCHAR(100),
    numero_serie VARCHAR(100),
    description TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_materiel_lignes_materiel ON materiel_employe_lignes(materiel_id);