-- =============================================
-- RH Avance : contrats, conges, pointage, historique paie
-- =============================================

-- CONTRATS DE TRAVAIL
CREATE TABLE IF NOT EXISTS contrats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    type_contrat VARCHAR(50) NOT NULL, -- cdi, cdd, stage, freelance
    date_debut DATE NOT NULL,
    date_fin DATE,
    poste VARCHAR(255),
    salaire_base DECIMAL(15,2) NOT NULL,
    prime_mensuelle DECIMAL(15,2) DEFAULT 0,
    heures_semaine INTEGER DEFAULT 40,
    statut VARCHAR(20) DEFAULT 'actif', -- actif, suspendu, termine
    document_url TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_contrats_employe ON contrats(employe_id);

-- TYPES DE CONGES
CREATE TABLE IF NOT EXISTS types_conge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    jours_annee INTEGER DEFAULT 0,
    paye BOOLEAN DEFAULT true
);

-- DEMANDES DE CONGES
CREATE TABLE IF NOT EXISTS demandes_conge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    type_conge_id UUID REFERENCES types_conge(id),
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    nb_jours INTEGER NOT NULL,
    motif TEXT,
    statut VARCHAR(20) DEFAULT 'en_attente', -- en_attente, approuve, refuse, annule
    approuve_par UUID,
    date_decision TIMESTAMP,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_demandes_conge_employe ON demandes_conge(employe_id);
CREATE INDEX idx_demandes_conge_statut ON demandes_conge(statut);

-- POINTAGE
CREATE TABLE IF NOT EXISTS pointages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    heure_arrivee TIME,
    heure_depart TIME,
    heures_travaillees DECIMAL(5,2),
    heures_supplementaires DECIMAL(5,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'present', -- present, absent, conge, ferie
    notes TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_pointages_employe_date ON pointages(employe_id, date);
CREATE INDEX idx_pointages_date ON pointages(date);

-- HISTORIQUE PAIE (fiches de paie archivées)
CREATE TABLE IF NOT EXISTS historique_paie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    salaire_base DECIMAL(15,2) NOT NULL,
    primes DECIMAL(15,2) DEFAULT 0,
    heures_sup DECIMAL(15,2) DEFAULT 0,
   retenues_cnps DECIMAL(15,2) DEFAULT 0,
    retenues_irpp DECIMAL(15,2) DEFAULT 0,
    autres_retenues DECIMAL(15,2) DEFAULT 0,
    net_a_payer DECIMAL(15,2) NOT NULL,
    date_paiement DATE,
    statut VARCHAR(20) DEFAULT 'en_attente', -- en_attente, paye
    cree_le TIMESTAMP DEFAULT NOW(),
    UNIQUE(entreprise_id, employe_id, mois, annee)
);
CREATE INDEX idx_historique_paie_employe ON historique_paie(employe_id);
CREATE INDEX idx_historique_paie_periode ON historique_paie(annee, mois);
