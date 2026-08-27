-- Migration 015 : RH étendu — Contrats, Paie, Congés, Évaluations
-- Date : 2026-08-25

-- =============================================
-- 1. CONTRATS DE TRAVAIL
-- =============================================
CREATE TABLE IF NOT EXISTS contrats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  type_contrat VARCHAR(20) NOT NULL CHECK (type_contrat IN ('CDI', 'CDD', 'Stage', 'Freelance', 'Apprentissage', 'Prestation')),
  date_debut DATE NOT NULL,
  date_fin DATE,
  salaire_brut NUMERIC(15, 2) NOT NULL DEFAULT 0,
  periode_essai_jours INT DEFAULT 0,
  poste TEXT,
  avantages_nature TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('brouillon', 'actif', 'termine', 'rompu')),
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ,
  supprime_le TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contrats_entreprise ON contrats(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_contrats_employe ON contrats(employe_id);

-- =============================================
-- 2. BULLETINS DE PAIE
-- =============================================
CREATE TABLE IF NOT EXISTS bulletins_paie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  contrat_id UUID REFERENCES contrats(id) ON DELETE SET NULL,
  mois INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee INT NOT NULL CHECK (annee BETWEEN 2020 AND 2100),
  salaire_brut NUMERIC(15, 2) NOT NULL,
  heures_sup NUMERIC(15, 2) DEFAULT 0,
  primes NUMERIC(15, 2) DEFAULT 0,
  indemnites NUMERIC(15, 2) DEFAULT 0,
  cnps NUMERIC(15, 2) NOT NULL DEFAULT 0,
  irpp NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cac NUMERIC(15, 2) NOT NULL DEFAULT 0,       -- Centimes additionnels communaux (OHADA/Cameroun)
  cfc NUMERIC(15, 2) NOT NULL DEFAULT 0,       -- Crédit foncier
  fne NUMERIC(15, 2) NOT NULL DEFAULT 0,       -- FNE employeur / part salariale
  avances_acomptes NUMERIC(15, 2) DEFAULT 0,
  autres_retenues NUMERIC(15, 2) DEFAULT 0,
  salaire_net NUMERIC(15, 2) NOT NULL,
  date_paiement DATE,
  mode_paiement VARCHAR(30) DEFAULT 'virement' CHECK (mode_paiement IN ('virement', 'especes', 'cheque', 'mobile_money')),
  statut VARCHAR(20) DEFAULT 'genere' CHECK (statut IN ('brouillon', 'genere', 'valide', 'paye')),
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ,
  UNIQUE(entreprise_id, employe_id, mois, annee)
);

CREATE INDEX IF NOT EXISTS idx_bulletins_entreprise_periode ON bulletins_paie(entreprise_id, annee, mois);
CREATE INDEX IF NOT EXISTS idx_bulletins_employe ON bulletins_paie(employe_id);

-- =============================================
-- 3. SOLDES DE CONGÉS
-- =============================================
CREATE TABLE IF NOT EXISTS soldes_conges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  annee INT NOT NULL CHECK (annee BETWEEN 2020 AND 2100),
  jours_acquis NUMERIC(5, 2) NOT NULL DEFAULT 0,
  jours_pris NUMERIC(5, 2) NOT NULL DEFAULT 0,
  jours_reportes NUMERIC(5, 2) NOT NULL DEFAULT 0,
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ,
  UNIQUE(entreprise_id, employe_id, annee)
);

CREATE INDEX IF NOT EXISTS idx_soldes_conges_employe ON soldes_conges(employe_id);

-- =============================================
-- 4. DEMANDES DE CONGÉS
-- =============================================
CREATE TABLE IF NOT EXISTS demandes_conges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  type_conge VARCHAR(30) NOT NULL CHECK (type_conge IN ('annuel', 'maladie', 'maternite', 'paternite', 'sans_solde', 'exceptionnel', 'formation')),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nb_jours NUMERIC(5, 2) NOT NULL,
  motif TEXT,
  justificatif_url TEXT,
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuve', 'refuse', 'annule')),
  approuve_par UUID REFERENCES utilisateurs(id),
  date_decision TIMESTAMPTZ,
  commentaire_rh TEXT,
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demandes_conges_entreprise ON demandes_conges(entreprise_id, statut);
CREATE INDEX IF NOT EXISTS idx_demandes_conges_employe ON demandes_conges(employe_id);

-- =============================================
-- 5. ÉVALUATIONS ANNUELLES / ENTRETIENS
-- =============================================
CREATE TABLE IF NOT EXISTS evaluations_annuelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
  annee INT NOT NULL CHECK (annee BETWEEN 2020 AND 2100),
  evaluateur_id UUID REFERENCES utilisateurs(id),
  note_globale NUMERIC(3, 1) CHECK (note_globale BETWEEN 0 AND 10),
  note_technique NUMERIC(3, 1) CHECK (note_technique BETWEEN 0 AND 10),
  note_relationnelle NUMERIC(3, 1) CHECK (note_relationnelle BETWEEN 0 AND 10),
  note_objectifs NUMERIC(3, 1) CHECK (note_objectifs BETWEEN 0 AND 10),
  points_forts TEXT,
  axes_amelioration TEXT,
  objectifs_annee_suivante TEXT,
  plan_formation TEXT,
  souhaits_evolution TEXT,
  date_entretien DATE,
  statut VARCHAR(20) DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'realise', 'valide', 'annule')),
  cree_le TIMESTAMPTZ DEFAULT NOW(),
  mis_a_jour_le TIMESTAMPTZ,
  UNIQUE(entreprise_id, employe_id, annee)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_entreprise ON evaluations_annuelles(entreprise_id, annee);
CREATE INDEX IF NOT EXISTS idx_evaluations_employe ON evaluations_annuelles(employe_id);
