-- =============================================
-- KOLEYA — SCRIPT DE REPRISE MAÎTRE (idempotent)
-- =============================================
-- Objectif : reconstruire TOUT l'état de schéma attendu par le backend,
-- peu importe lesquelles des migrations 001→016 ont déjà tourné.
-- SÛR À EXÉCUTER PLUSIEURS FOIS (CREATE TABLE IF NOT EXISTS partout,
-- ALTER ... ADD COLUMN IF NOT EXISTS partout, CREATE OR REPLACE FUNCTION/VIEW).
--
-- À exécuter dans l'éditeur SQL de Supabase APRÈS avoir lu ZZ_DIAGNOSTIC.
-- Si vous ne voulez pas de diagnostic : exécutez ce fichier directement,
-- il ne cassera rien car il est idempotent.
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLES DE BASE (shape de 001_complete_schema / 001_init)
--    On utilise IF NOT EXISTS : si la table existe déjà, on ne touche pas.
-- ============================================================

CREATE TABLE IF NOT EXISTS entreprises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL, adresse TEXT, telephone VARCHAR(50), email VARCHAR(255),
    nrcc VARCHAR(100), logo TEXT, cachet TEXT, devise VARCHAR(10) DEFAULT 'XAF',
    tva DECIMAL(5,2) DEFAULT 0, prefixe_facture VARCHAR(10) DEFAULT 'FAC',
    prefixe_devis VARCHAR(10) DEFAULT 'DEV', delai_paiement INTEGER DEFAULT 30,
    plan VARCHAR(50) DEFAULT 'starter', essai_active BOOLEAN DEFAULT true,
    essai_fin TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
    actif BOOLEAN DEFAULT true, pays_code VARCHAR(5) DEFAULT 'CM', langue VARCHAR(10) DEFAULT 'fr',
    cree_le TIMESTAMP DEFAULT NOW(), mis_a_jour_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL, mot_de_passe VARCHAR(255) NOT NULL, nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(50), role VARCHAR(50) DEFAULT 'employe', est_super_admin BOOLEAN DEFAULT false,
    actif BOOLEAN DEFAULT true, derniere_connexion TIMESTAMP, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);

-- refresh_tokens : le backend (auth.js) insère dans (utilisateur_id, token, expires_at).
-- 001_complete l'avait créée avec token_hash → on réconcilie vers "token".
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refresh_tokens') THEN
    CREATE TABLE refresh_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
      token VARCHAR(500) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      cree_le TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(utilisateur_id);
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'token') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'token_hash') THEN
      ALTER TABLE refresh_tokens RENAME COLUMN token_hash TO token;
    ELSE
      ALTER TABLE refresh_tokens ADD COLUMN token VARCHAR(500) NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(utilisateur_id);

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL, telephone VARCHAR(50), email VARCHAR(255), adresse TEXT,
    ville VARCHAR(100), pays_code VARCHAR(5) DEFAULT 'CM', solde DECIMAL(15,2) DEFAULT 0,
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW(), mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_entreprise ON clients(entreprise_id);

CREATE TABLE IF NOT EXISTS produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL, reference VARCHAR(100), code_barres VARCHAR(100),
    categorie VARCHAR(100), unite VARCHAR(20) DEFAULT 'unite',
    stock INTEGER DEFAULT 0, stock_min INTEGER DEFAULT 0,
    prix_achat DECIMAL(15,2) DEFAULT 0, prix_vente DECIMAL(15,2) DEFAULT 0,
    fournisseur VARCHAR(255), emplacement VARCHAR(100), actif BOOLEAN DEFAULT true,
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW(), mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_produits_entreprise ON produits(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_produits_reference ON produits(entreprise_id, reference);

CREATE TABLE IF NOT EXISTS factures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL, type VARCHAR(20) NOT NULL DEFAULT 'facture',
    statut VARCHAR(50) DEFAULT 'en_attente', date DATE NOT NULL DEFAULT CURRENT_DATE,
    echeance DATE, total DECIMAL(15,2) NOT NULL DEFAULT 0, paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) DEFAULT 0, notes TEXT,
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW(), mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_factures_entreprise ON factures(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_factures_client ON factures(client_id);

CREATE TABLE IF NOT EXISTS facture_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL, quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0, total DECIMAL(15,2) NOT NULL DEFAULT 0, ordre INTEGER DEFAULT 0,
    taux_tva DECIMAL(5,2) DEFAULT 0, remise_pct DECIMAL(5,2) DEFAULT 0,
    montant_ht DECIMAL(15,2) DEFAULT 0, montant_ttc DECIMAL(15,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ventes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id), numero VARCHAR(50) NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_cours', date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode_paiement VARCHAR(50) DEFAULT 'especes',
    montant_total DECIMAL(15,2) NOT NULL DEFAULT 0, remise DECIMAL(15,2) DEFAULT 0,
    montant_final DECIMAL(15,2) NOT NULL DEFAULT 0, montant_paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) DEFAULT 0, notes TEXT,
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW(), mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS vente_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vente_id UUID NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES produits(id),
    description VARCHAR(500) NOT NULL, quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0, remise DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0, ordre INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS achats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    fournisseur VARCHAR(255), numero VARCHAR(50) NOT NULL,
    statut VARCHAR(50) DEFAULT 'en_cours', date DATE NOT NULL DEFAULT CURRENT_DATE,
    mode_paiement VARCHAR(50) DEFAULT 'especes',
    montant_total DECIMAL(15,2) NOT NULL DEFAULT 0, remise DECIMAL(15,2) DEFAULT 0,
    montant_final DECIMAL(15,2) NOT NULL DEFAULT 0, montant_paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) DEFAULT 0, notes TEXT,
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW(), mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS achat_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    achat_id UUID NOT NULL REFERENCES achats(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES produits(id),
    description VARCHAR(500) NOT NULL, quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(15,2) NOT NULL DEFAULT 0, remise DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0, ordre INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    montant_total DECIMAL(15,2) NOT NULL, montant_paye DECIMAL(15,2) DEFAULT 0,
    reste DECIMAL(15,2) NOT NULL, description TEXT,
    date_vente DATE NOT NULL DEFAULT CURRENT_DATE, echeance DATE,
    statut VARCHAR(50) DEFAULT 'en_cours',
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW(), mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credits_entreprise ON credits(entreprise_id);
CREATE TABLE IF NOT EXISTS credit_paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
    montant DECIMAL(15,2) NOT NULL, methode VARCHAR(50) DEFAULT 'especes',
    date DATE NOT NULL DEFAULT CURRENT_DATE, notes TEXT, cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mouvements_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    depot_id UUID, depot_destination_id UUID,
    type_mouvement VARCHAR(30) NOT NULL,
    quantite INTEGER NOT NULL, quantite_avant INTEGER, quantite_apres INTEGER,
    prix_unitaire DECIMAL(15,2), motif TEXT, reference VARCHAR(100), utilisateur VARCHAR(255),
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mouvements_entreprise ON mouvements_stock(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_produit ON mouvements_stock(produit_id);

CREATE TABLE IF NOT EXISTS employes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL, poste VARCHAR(255), salaire DECIMAL(15,2) DEFAULT 0,
    date_embauche DATE, telephone VARCHAR(50), statut VARCHAR(50) DEFAULT 'actif',
    conges_jours INTEGER DEFAULT 0,
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW(), mis_a_jour_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_employes_entreprise ON employes(entreprise_id);

CREATE TABLE IF NOT EXISTS depenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    categorie VARCHAR(100) NOT NULL, description TEXT,
    montant DECIMAL(15,2) NOT NULL, date DATE NOT NULL DEFAULT CURRENT_DATE,
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    canal VARCHAR(20) DEFAULT 'sms', destinataire VARCHAR(255) NOT NULL,
    destinataire_nom VARCHAR(255), sujet VARCHAR(255), message TEXT NOT NULL,
    statut VARCHAR(20) DEFAULT 'en_attente', type_source VARCHAR(50), source_id UUID,
    date_envoi TIMESTAMP, reponse_api TEXT, erreur TEXT,
    supprime_le TIMESTAMP, supprime_par UUID, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_entreprise ON notifications(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_notifications_statut ON notifications(statut);

CREATE TABLE IF NOT EXISTS paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    facture_id UUID REFERENCES factures(id), montant DECIMAL(15,2) NOT NULL,
    methode VARCHAR(50) DEFAULT 'mobile_money', transaction_id VARCHAR(255),
    provider VARCHAR(50), statut VARCHAR(20) DEFAULT 'en_attente',
    date_paiement TIMESTAMP, reponse_api JSONB, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_paiements_entreprise ON paiements(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);

CREATE TABLE IF NOT EXISTS sequence_numeros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, annee INTEGER NOT NULL, compteur INTEGER DEFAULT 0,
    UNIQUE(entreprise_id, type, annee)
);

CREATE TABLE IF NOT EXISTS abonnements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE UNIQUE,
    plan VARCHAR(50) DEFAULT 'starter', statut VARCHAR(20) DEFAULT 'essai',
    date_debut DATE DEFAULT CURRENT_DATE, date_fin DATE,
    prix_mensuel DECIMAL(10,2) DEFAULT 0, cree_le TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. COLONNES AJOUTÉES PAR LES MIGRATIONS 002→014 (ADD IF NOT EXISTS)
-- ============================================================

-- 004 abonnements / soft delete
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS essai_fin TIMESTAMP;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS essai_active BOOLEAN DEFAULT true;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS periode_comptage_debut TIMESTAMP DEFAULT NOW();
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS dernier_achat_le TIMESTAMP;
ALTER TABLE clients      ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE clients      ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE factures     ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE factures     ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE credits      ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE credits      ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE produits     ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE produits     ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE produits     ADD COLUMN IF NOT EXISTS code_barres VARCHAR(100);
ALTER TABLE produits     ADD COLUMN IF NOT EXISTS unite VARCHAR(20) DEFAULT 'unite';
ALTER TABLE produits     ADD COLUMN IF NOT EXISTS emplacement VARCHAR(100);
ALTER TABLE produits     ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true;
ALTER TABLE employes     ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE employes     ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE depenses     ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE depenses     ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS supprime_par UUID;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_super_admin BOOLEAN DEFAULT false;

-- 007 multi-pays
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS pays_code VARCHAR(5) DEFAULT 'CM';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS langue VARCHAR(10) DEFAULT 'fr';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ville VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pays_code VARCHAR(5) DEFAULT 'CM';

-- 010 2FA / OAuth / reset
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS two_factor_active BOOLEAN DEFAULT false;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS two_factor_canal VARCHAR(20) DEFAULT 'sms';
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateurs_google ON utilisateurs(google_id) WHERE google_id IS NOT NULL;

-- 012 champs documents
ALTER TABLE factures ADD COLUMN IF NOT EXISTS envoye_a TEXT;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS commande_numero VARCHAR(100);
ALTER TABLE factures ADD COLUMN IF NOT EXISTS conditions_paiement TEXT DEFAULT 'Paiement a 15 jours reception de la facture.';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS envoye_par_email BOOLEAN DEFAULT false;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS date_envoi_email TIMESTAMP;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS template_style VARCHAR(50) DEFAULT 'classique-bleu';
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS envoye_a TEXT;
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS commande_numero VARCHAR(100);
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS conditions_paiement TEXT DEFAULT 'Payable comptant';
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE ventes ADD COLUMN IF NOT EXISTS template_style VARCHAR(50) DEFAULT 'classique-bleu';
ALTER TABLE achats ADD COLUMN IF NOT EXISTS envoye_a TEXT;
ALTER TABLE achats ADD COLUMN IF NOT EXISTS commande_numero VARCHAR(100);
ALTER TABLE achats ADD COLUMN IF NOT EXISTS conditions_paiement TEXT DEFAULT 'Facultatif';
ALTER TABLE achats ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE achats ADD COLUMN IF NOT EXISTS template_style VARCHAR(50) DEFAULT 'classique-bleu';

-- 013 TVA/remise/totaux/devise
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS taux_tva DECIMAL(5,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS remise_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS montant_ht DECIMAL(15,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS montant_ttc DECIMAL(15,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS remise_globale DECIMAL(5,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS total_ht DECIMAL(15,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS total_ttc DECIMAL(15,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'XAF';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS template_style VARCHAR(30) DEFAULT 'classique-bleu';

-- 015 prefixes des 10 types
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_facture_fiscale VARCHAR(10) DEFAULT 'FIS';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_facture_proforma VARCHAR(10) DEFAULT 'PRO';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu VARCHAR(10) DEFAULT 'REC';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu_vente VARCHAR(10) DEFAULT 'REV';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu_caisse VARCHAR(10) DEFAULT 'RCA';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_note_credit VARCHAR(10) DEFAULT 'NDC';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_bon_commande VARCHAR(10) DEFAULT 'BCM';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_bon_livraison VARCHAR(10) DEFAULT 'BLV';

-- 011 paiements avances
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS facture_type VARCHAR(20) DEFAULT 'facture';
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS preuve_url TEXT;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS preuve_filename VARCHAR(255);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMP;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS supprime_par UUID;
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_paiements_stripe ON paiements(stripe_session_id);

-- 014 RH profil employe (~20 colonnes)
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

-- ============================================================
-- 3. TABLES CRÉÉES PAR LES MIGRATIONS 002→016
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_regles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL, type_source VARCHAR(50) NOT NULL, actif BOOLEAN DEFAULT true,
    delai_jours INTEGER DEFAULT 3, template_sms TEXT, template_whatsapp TEXT, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_regles_entreprise ON notification_regles(entreprise_id);

CREATE TABLE IF NOT EXISTS depots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL, adresse TEXT, responsable VARCHAR(255),
    principal BOOLEAN DEFAULT false, actif BOOLEAN DEFAULT true, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_depots_entreprise ON depots(entreprise_id);

CREATE TABLE IF NOT EXISTS stock_depot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    depot_id UUID NOT NULL REFERENCES depots(id) ON DELETE CASCADE,
    quantite INTEGER DEFAULT 0, UNIQUE(produit_id, depot_id)
);
CREATE INDEX IF NOT EXISTS idx_stock_depot_produit ON stock_depot(produit_id);
CREATE INDEX IF NOT EXISTS idx_stock_depot_depot ON stock_depot(depot_id);

CREATE TABLE IF NOT EXISTS comptes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    numero VARCHAR(20) NOT NULL, intitule VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, classe INTEGER NOT NULL, parent_id UUID REFERENCES comptes(id),
    actif BOOLEAN DEFAULT true, cree_le TIMESTAMP DEFAULT NOW(), UNIQUE(entreprise_id, numero)
);
CREATE INDEX IF NOT EXISTS idx_comptes_entreprise ON comptes(entreprise_id);

CREATE TABLE IF NOT EXISTS ecritures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    journal VARCHAR(10) NOT NULL, numero INTEGER NOT NULL, date DATE NOT NULL,
    libelle TEXT NOT NULL, reference VARCHAR(100), source_type VARCHAR(30), source_id UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ecritures_entreprise ON ecritures(entreprise_id);

CREATE TABLE IF NOT EXISTS ecriture_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ecriture_id UUID NOT NULL REFERENCES ecritures(id) ON DELETE CASCADE,
    compte_id UUID NOT NULL REFERENCES comptes(id), debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0, ordre INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ecriture_lignes_ecriture ON ecriture_lignes(ecriture_id);

CREATE TABLE IF NOT EXISTS tva_regimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    taux DECIMAL(5,2) NOT NULL, libelle VARCHAR(100) NOT NULL, actif BOOLEAN DEFAULT true
);
CREATE TABLE IF NOT EXISTS declarations_tva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    periode_debut DATE NOT NULL, periode_fin DATE NOT NULL,
    ca_ht DECIMAL(15,2) DEFAULT 0, tva_collectee DECIMAL(15,2) DEFAULT 0,
    tva_deductible DECIMAL(15,2) DEFAULT 0, tva_a_payer DECIMAL(15,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'brouillon', date_declaration DATE, date_paiement DATE,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom TEXT NOT NULL, type_mime TEXT, taille INTEGER DEFAULT 0, contenu TEXT,
    cree_le TIMESTAMPTZ DEFAULT now(), supprime_le TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_documents_entreprise ON documents(entreprise_id);

CREATE TABLE IF NOT EXISTS contrats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    type_contrat VARCHAR(50) NOT NULL, date_debut DATE NOT NULL, date_fin DATE,
    poste VARCHAR(255), salaire_base DECIMAL(15,2) NOT NULL, prime_mensuelle DECIMAL(15,2) DEFAULT 0,
    heures_semaine INTEGER DEFAULT 40, statut VARCHAR(20) DEFAULT 'actif', document_url TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contrats_employe ON contrats(employe_id);

CREATE TABLE IF NOT EXISTS types_conge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL, jours_annee INTEGER DEFAULT 0, paye BOOLEAN DEFAULT true
);
CREATE TABLE IF NOT EXISTS demandes_conge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    type_conge_id UUID REFERENCES types_conge(id), date_debut DATE NOT NULL, date_fin DATE NOT NULL,
    nb_jours INTEGER NOT NULL, motif TEXT, statut VARCHAR(20) DEFAULT 'en_attente',
    approuve_par UUID, date_decision TIMESTAMP, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_demandes_conge_employe ON demandes_conge(employe_id);
CREATE TABLE IF NOT EXISTS pointages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE, heure_arrivee TIME, heure_depart TIME,
    heures_travaillees DECIMAL(5,2), heures_supplementaires DECIMAL(5,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'present', notes TEXT, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS historique_paie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    mois INTEGER NOT NULL, annee INTEGER NOT NULL, salaire_base DECIMAL(15,2) NOT NULL,
    primes DECIMAL(15,2) DEFAULT 0, heures_sup DECIMAL(15,2) DEFAULT 0,
    retenues_cnps DECIMAL(15,2) DEFAULT 0, retenues_irpp DECIMAL(15,2) DEFAULT 0,
    autres_retenues DECIMAL(15,2) DEFAULT 0, net_a_payer DECIMAL(15,2) NOT NULL,
    date_paiement DATE, statut VARCHAR(20) DEFAULT 'en_attente',
    cree_le TIMESTAMP DEFAULT NOW(), UNIQUE(entreprise_id, employe_id, mois, annee)
);
CREATE INDEX IF NOT EXISTS idx_historique_paie_employe ON historique_paie(employe_id);

CREATE TABLE IF NOT EXISTS pays (
    code VARCHAR(5) PRIMARY KEY, nom VARCHAR(100) NOT NULL, devise VARCHAR(10) NOT NULL,
    symbole_devise VARCHAR(5), fuseau VARCHAR(50) NOT NULL, langue_principale VARCHAR(10) DEFAULT 'fr',
    format_telephone VARCHAR(50), prefixe_telephone VARCHAR(10), provider_sms VARCHAR(50),
    provider_mobile_money VARCHAR(50), actif BOOLEAN DEFAULT true
);
INSERT INTO pays (code, nom, devise, symbole_devise, fuseau, prefixe_telephone, provider_sms) VALUES
('CM', 'Cameroun', 'XAF', 'FCFA', 'Africa/Douala', '+237', 'africastalking'),
('GA', 'Gabon', 'XAF', 'FCFA', 'Africa/Libreville', '+241', 'africastalking'),
('CG', 'Congo', 'XAF', 'FCFA', 'Africa/Brazzaville', '+242', 'africastalking'),
('CI', 'Cote d''Ivoire', 'XOF', 'FCFA', 'Africa/Abidjan', '+225', 'africastalking'),
('SN', 'Senegal', 'XOF', 'FCFA', 'Africa/Dakar', '+221', 'africastalking'),
('NG', 'Nigeria', 'NGN', '₦', 'Africa/Lagos', '+234', 'africastalking')
ON CONFLICT (code) DO NOTHING;
CREATE TABLE IF NOT EXISTS config_pays (
    pays_code VARCHAR(5) NOT NULL REFERENCES pays(code), cle VARCHAR(100) NOT NULL, valeur TEXT,
    PRIMARY KEY (pays_code, cle)
);
INSERT INTO config_pays (pays_code, cle, valeur) VALUES
('CM', 'tva_defaut', '19.25'),
('CM', 'cnps_taux_salarie', '0.042'),
('CM', 'cnps_taux_employeur', '0.0865'),
('CM', 'irpp_tranches', '[[0,200000,0],[200001,300000,10],[300001,+∞,15]]'),
('GA', 'tva_defaut', '18'),
('CG', 'tva_defaut', '18.9'),
('CI', 'tva_defaut', '18'),
('SN', 'tva_defaut', '18')
ON CONFLICT (pays_code, cle) DO NOTHING;

CREATE TABLE IF NOT EXISTS api_cles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL, cle_publique VARCHAR(50) NOT NULL, cle_privee VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '["read"]', rate_limit INTEGER DEFAULT 1000, actif BOOLEAN DEFAULT true,
    derniere_utilisation TIMESTAMP, expires_at TIMESTAMP, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_cles_publique ON api_cles(cle_publique);
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_cle_id UUID NOT NULL REFERENCES api_cles(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL, methode VARCHAR(10) NOT NULL, status_code INTEGER,
    duree_ms INTEGER, ip_address VARCHAR(45), user_agent TEXT, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL, events JSONB DEFAULT '["facture.creee"]', secret VARCHAR(255),
    actif BOOLEAN DEFAULT true, derniere_invocation TIMESTAMP, derniere_reponse INTEGER,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL, payload JSONB, status_code INTEGER, reponse TEXT,
    duree_ms INTEGER, cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS two_factor_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL, canal VARCHAR(20) NOT NULL DEFAULT 'sms',
    utilise BOOLEAN DEFAULT false, expires_at TIMESTAMP NOT NULL, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_2fa_user ON two_factor_codes(utilisateur_id);
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, expires_at TIMESTAMP NOT NULL, utilise BOOLEAN DEFAULT false,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    ip_address VARCHAR(45), user_agent TEXT, succes BOOLEAN DEFAULT true,
    methode VARCHAR(20) DEFAULT 'password', cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
    vente_id UUID REFERENCES ventes(id) ON DELETE CASCADE,
    achat_id UUID REFERENCES achats(id) ON DELETE CASCADE,
    taux DECIMAL(5,2) NOT NULL, libelle VARCHAR(100) DEFAULT 'TVA', montant DECIMAL(15,2) NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS email_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    destinataire VARCHAR(255) NOT NULL, sujet VARCHAR(255) NOT NULL, document_type VARCHAR(30),
    document_id UUID, statut VARCHAR(20) DEFAULT 'envoye', erreur TEXT, cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devis_meta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    type_devis VARCHAR(30) NOT NULL DEFAULT 'standard', mode_calcul VARCHAR(30),
    surface DECIMAL(15,2), taux DECIMAL(15,2), duree INTEGER, nb_intervenants INTEGER,
    mention VARCHAR(50), validite_jours INTEGER DEFAULT 30, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_devis_meta_facture ON devis_meta(facture_id);

CREATE TABLE IF NOT EXISTS rh_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    type_document VARCHAR(50) NOT NULL, titre TEXT, variables JSONB, pdf_url TEXT,
    statut VARCHAR(20) DEFAULT 'brouillon', cree_par UUID, cree_le TIMESTAMP DEFAULT NOW(), supprime_le TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rh_docs_entreprise ON rh_documents(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_rh_docs_employe ON rh_documents(employe_id);
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    objet TEXT, destination TEXT, date_debut DATE, date_fin DATE, motif TEXT,
    moyen_transport VARCHAR(100), statut VARCHAR(20) DEFAULT 'brouillon', approuve_par UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notes_frais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date_soumission DATE DEFAULT CURRENT_DATE, statut VARCHAR(20) DEFAULT 'en_attente',
    total DECIMAL(15,2) DEFAULT 0, approuve_par UUID, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notes_frais_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_frais_id UUID NOT NULL REFERENCES notes_frais(id) ON DELETE CASCADE,
    date_frais DATE, categorie VARCHAR(100), description TEXT, montant DECIMAL(15,2) NOT NULL,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS visites_medicales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date_visite DATE, centre_medical VARCHAR(255), medecin VARCHAR(255), aptitude VARCHAR(50),
    restrictions TEXT, prochaine_visite DATE, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS materiel_employe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date_mise_a_disposition DATE DEFAULT CURRENT_DATE, statut VARCHAR(20) DEFAULT 'actif',
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS materiel_employe_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materiel_id UUID NOT NULL REFERENCES materiel_employe(id) ON DELETE CASCADE,
    type_materiel VARCHAR(100), marque VARCHAR(100), numero_serie VARCHAR(100), description TEXT,
    cree_le TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    module VARCHAR(20) NOT NULL, document_id UUID NOT NULL, type_document VARCHAR(50),
    numero VARCHAR(50), pdf_url TEXT, variables JSONB, empreinte VARCHAR(64),
    cree_par UUID, cree_le TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS document_historique (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    module VARCHAR(20) NOT NULL, document_id UUID NOT NULL, action VARCHAR(50) NOT NULL,
    statut_avant VARCHAR(50) DEFAULT '', statut_apres VARCHAR(50), utilisateur_id UUID,
    details TEXT, date TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. FONCTION GENERER_NUMERO (10 types) — version réconciliée de 015
-- ============================================================
CREATE OR REPLACE FUNCTION generer_numero(p_entreprise_id UUID, p_type VARCHAR(20))
RETURNS VARCHAR(50) AS $$
DECLARE
  v_prefixe VARCHAR(10);
  v_annee INTEGER;
  v_compteur INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM NOW())::INTEGER;
  SELECT CASE p_type
    WHEN 'facture' THEN COALESCE(prefixe_facture, 'FAC')
    WHEN 'facture_fiscale' THEN COALESCE(prefixe_facture_fiscale, 'FIS')
    WHEN 'facture_proforma' THEN COALESCE(prefixe_facture_proforma, 'PRO')
    WHEN 'recu' THEN COALESCE(prefixe_recu, 'REC')
    WHEN 'recu_vente' THEN COALESCE(prefixe_recu_vente, 'REV')
    WHEN 'recu_caisse' THEN COALESCE(prefixe_recu_caisse, 'RCA')
    WHEN 'note_credit' THEN COALESCE(prefixe_note_credit, 'NDC')
    WHEN 'bon_commande' THEN COALESCE(prefixe_bon_commande, 'BCM')
    WHEN 'bon_livraison' THEN COALESCE(prefixe_bon_livraison, 'BLV')
    WHEN 'devis' THEN COALESCE(prefixe_devis, 'DEV')
    ELSE COALESCE(prefixe_facture, 'FAC')
  END INTO v_prefixe
  FROM entreprises WHERE id = p_entreprise_id;

  INSERT INTO sequence_numeros (entreprise_id, type, annee, compteur)
  VALUES (p_entreprise_id, p_type, v_annee, 1)
  ON CONFLICT (entreprise_id, type, annee)
  DO UPDATE SET compteur = sequence_numeros.compteur + 1
  RETURNING compteur INTO v_compteur;

  RETURN v_prefixe || '-' || v_annee || '-' || LPAD(v_compteur::TEXT, 3, '0');
END; $$ LANGUAGE plpgsql;

-- ============================================================
-- 5. VUES (idempotentes)
-- ============================================================
CREATE OR REPLACE VIEW v_stock_depot AS
SELECT
    p.id AS produit_id, p.nom AS produit_nom, p.reference, p.code_barres,
    d.id AS depot_id, d.nom AS depot_nom,
    COALESCE(sd.quantite, 0) AS quantite,
    p.prix_achat, p.prix_vente,
    COALESCE(sd.quantite, 0) * p.prix_achat AS valeur
FROM produits p
CROSS JOIN depots d
LEFT JOIN stock_depot sd ON sd.produit_id = p.id AND sd.depot_id = d.id
WHERE p.actif IS NOT FALSE;

-- ============================================================
-- 6. COMPTES PLATEFORME & DÉMO — RESTAURATION DES 3 COMPTES
--    (idempotent : ne recrée rien si déjà présent)
--    1) Compte ESSAI EN COURS  -> entreprise "Koleya Essai" (essai_active = true)
--    2) Compte DÉMO            -> entreprise "Koleya Demo"
--    3) Super Admin plateforme -> entreprise "Koleya Plateforme"
-- ============================================================

-- 6.1 Super admin plateforme (entreprise dédiée)
DO $$
DECLARE
  v_eid UUID;
  v_hash TEXT := '$2a$12$z7EdyoOqeMYuUt4HNhTsaeCkN5rYHbOC9lfNgiVxpnRgUraaOSGji';
BEGIN
  IF NOT EXISTS (SELECT FROM utilisateurs WHERE email = 'superadmin@koleya.cm') THEN
    SELECT id INTO v_eid FROM entreprises WHERE nom = 'Koleya Plateforme';
    IF v_eid IS NULL THEN
      INSERT INTO entreprises (nom, plan, actif) VALUES ('Koleya Plateforme', 'business', true)
      RETURNING id INTO v_eid;
    END IF;
    INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role, est_super_admin, actif)
    VALUES (v_eid, 'superadmin@koleya.cm', v_hash, 'Super Admin Koleya', '+237 600 000 001', 'admin', true, true);
  END IF;
END
$$;

-- 6.2 Compte ESSAI EN COURS (essai_active = true, fin dans 7 jours)
INSERT INTO entreprises (nom, telephone, email, plan, essai_active, essai_fin, actif)
VALUES ('Koleya Essai', '+237600000001', 'essai@koleya.cm', 'business', true,
        (NOW() + INTERVAL '7 days'), true)
ON CONFLICT DO NOTHING;

INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role)
SELECT id, 'admin@koleya.cm', '$2a$12$LJ3m4ys3Pz0KjXvUe0bOzuhHnVcLpGx9kR2FqN4dM5hS7gT8uI0y', 'Admin Essai', '+237690000001', 'proprietaire'
FROM entreprises WHERE email = 'essai@koleya.cm' ON CONFLICT (email) DO NOTHING;

-- 6.3 Compte DÉMO (essai_active = false, déjà actif)
INSERT INTO entreprises (nom, telephone, email, plan, essai_active, essai_fin, actif)
VALUES ('Koleya Demo', '+237600000000', 'demo@koleya.cm', 'business', false, NULL, true)
ON CONFLICT DO NOTHING;

INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role, est_super_admin)
SELECT id, 'superadmin@koleya.cm', '$2a$12$LJ3m4ys3Pz0KjXvUe0bOzuhHnVcLpGx9kR2FqN4dM5hS7gT8uI0y', 'Super Admin', '+237600000000', 'proprietaire', true
FROM entreprises WHERE email = 'demo@koleya.cm' ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateurs (entreprise_id, email, mot_de_passe, nom, telephone, role)
SELECT id, 'admin@koleya.com', '$2a$12$LJ3m4ys3Pz0KjXvUe0bOzuhHnVcLpGx9kR2FqN4dM5hS7gT8uI0y', 'Admin Demo', '+237690000000', 'proprietaire'
FROM entreprises WHERE email = 'demo@koleya.cm' ON CONFLICT (email) DO NOTHING;

SELECT 'REPRISE TERMINEE — schema Koleya reconcile. Comptes: ESSAIs, DEMO, SUPER ADMIN.' AS resultat;
