# KOLEYA ERP — PLAN D'EXECUTION DU BLOC DE MODIFICATIONS

**Version :** 3.0
**Date :** 12 aout 2026
**Statut :** En attente de validation "GO"

---

## TABLE DES MATIERES

1. [Resume du bloc](#1-resume)
2. [Phase 0 — Fix Vercel](#phase-0--fix-vercel)
3. [Phase 1 — Module Facture (9 types)](#phase-1--module-facture)
4. [Phase 2 — Module Devis (9 types)](#phase-2--module-devis)
5. [Phase 3 — Module RH (14 documents)](#phase-3--module-rh)
6. [Phase 4 — Recherche/Filtres + Archivage/Historique](#phase-4--recherche-archivage)
7. [Phase 5 — Portail Client (optionnel)](#phase-5--portail-client)
8. [Migrations SQL a creer](#migrations)
9. [Liste complete des fichiers](#fichiers)
10. [Checklist de verification](#checklist)

---

## 1. RESUME DU BLOC

Ce bloc couvre l'ensemble des modifications demandees par l'utilisateur pour passer de l'etat actuel (Vercel casse, formulaires incomplets, RH minimaliste) a un ERP complet et fonctionnel.

### Modules concernes

| Module | Types de documents | Priorite |
|--------|-------------------|----------|
| Facture | 9 types (facture, fiscale, proforma, recu, recu vente, recu caisse, note credit, bon commande, bon livraison) | 🔴 P0 |
| Devis | 9 types (forfait, temps, m2, prestations, BTP, commercial, estimatif, descriptif, contrat) | 🔴 P0 |
| RH | 14 documents (contrat, avenant, attestation, certificat, solde tout compte, fiche de paie, ordre mission, note frais, demande conges, compte-rendu entretien, onboarding, visite medicale, recu materiel, fiche identification) | 🟡 P1 |
| Client | Module interne enrichi (pas de portail) | 🟡 P1 |
| Transversal | Recherche/filtres globaux + archivage/historique universels | 🟡 P1 |

---

## PHASE 0 — FIX VERCEL

> **Objectif** : corriger l'erreur "Unexpected token '<'" — l'API renvoie du HTML au lieu de JSON.
> **Duree estimee** : 0.5 j

### Probleme identifie

Le dossier `api/` ne contient que 3 fichiers (login.js, signup.js, clients/index.js) alors que le frontend appelle 15+ routes. Les routes inexistantes sont capturees par le fallback SPA (`index.html`) → erreur JSON.

### Solution

Monter l'application Express complete du backend comme **une seule fonction serverless** dans `api/[[...path]].js`.

### Etapes concretes

**Etape 1 — package.json racine : ajouter les dependances backend**

Ajouter dans `dependencies` :
```
express, cors, helmet, express-rate-limit, dotenv, uuid, zod
```
Retirer la dep parasite `"2": "^3.0.0"`.

> Note : bcryptjs, jsonwebtoken, pg sont deja presents.

**Etape 2 — Creer `api/[[...path]].js`**

```javascript
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Charge l'app Express depuis le backend (CJS)
const app = require('../backend/src/server.js')

export default function handler(req, res) {
  app(req, res)
}
```

Le `require.main === module` dans server.js empeche le `listen()` de se declencher sur Vercel.

**Etape 3 — Supprimer les fichiers redondants**

- `api/auth/login.js`
- `api/auth/signup.js`
- `api/clients/index.js`
- `api/[...slug].js`

**Etape 4 — Verifier vercel.json**

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "functions": { "api/**/*.js": { "maxDuration": 10 } }
}
```

**Etape 5 — Variables d'environnement Vercel**

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://postgres.etkguxaroezjywrujfom:Koleya2026%21@aws-1-eu-west-1.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | (secret defini en local) |
| `CORS_ORIGIN` | `https://koleya-erp.vercel.app` |
| `NODE_ENV` | `production` |

### Tests de validation

| Test | Resultat attendu |
|------|-----------------|
| `GET /api/health` | `{"status":"ok"}` |
| `POST /api/auth/login` | JSON (pas de HTML) |
| `GET /api/clients` (avec token) | JSON avec tableau de clients |
| `POST /api/factures` (avec token) | JSON avec facture creee |

---

## PHASE 1 — MODULE FACTURE

> **Objectif** : formulaire unifie pour les 9 types de documents facture + selecteur template + tracabilite.
> **Duree estimee** : 3-4 j

### 1.0 NUMEROTATION AUTOMATIQUE DES DOCUMENTS (PREREQUIS)

> Chaque type de document a sa **propre sequence** (prefixe + compteur annuel), garantissant
> un numero unique non duplicable. Format : `{PREFIXE}-{ANNEE}-{SEQ}` ex: `FAC-2026-001`.

#### Prefixes par type (defauts Cameroun)

| Type de document | Colonne `entreprises` | Defaut | Exemple |
|------------------|----------------------|--------|---------|
| facture | `prefixe_facture` | `FAC` | FAC-2026-001 |
| facture_fiscale | `prefixe_facture_fiscale` | `FIS` | FIS-2026-001 |
| facture_proforma | `prefixe_facture_proforma` | `PRO` | PRO-2026-001 |
| recu | `prefixe_recu` | `REC` | REC-2026-001 |
| recu_vente | `prefixe_recu_vente` | `REV` | REV-2026-001 |
| recu_caisse | `prefixe_recu_caisse` | `RCA` | RCA-2026-001 |
| note_credit | `prefixe_note_credit` | `NDC` | NDC-2026-001 |
| bon_commande | `prefixe_bon_commande` | `BCM` | BCM-2026-001 |
| bon_livraison | `prefixe_bon_livraison` | `BLV` | BLV-2026-001 |
| devis | `prefixe_devis` | `DEV` | DEV-2026-001 |

#### Migration `015_numerotation.sql`

```sql
-- 1. Ajouter les colonnes prefixe a la table entreprises
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_facture_fiscale VARCHAR(10) DEFAULT 'FIS';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_facture_proforma VARCHAR(10) DEFAULT 'PRO';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu VARCHAR(10) DEFAULT 'REC';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu_vente VARCHAR(10) DEFAULT 'REV';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_recu_caisse VARCHAR(10) DEFAULT 'RCA';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_note_credit VARCHAR(10) DEFAULT 'NDC';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_bon_commande VARCHAR(10) DEFAULT 'BCM';
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS prefixe_bon_livraison VARCHAR(10) DEFAULT 'BLV';

-- 2. Fonction generer_numero etendue (mappe chaque type -> son prefixe)
CREATE OR REPLACE FUNCTION generer_numero(p_entreprise_id UUID, p_type VARCHAR(20))
RETURNS VARCHAR(50) AS $$
DECLARE
  v_prefixe VARCHAR(10);
  v_annee INTEGER;
  v_compteur INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM NOW())::INTEGER;

  -- Mapping type -> colonne prefixe
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

  -- Increment atomique du compteur (sequence_numeros a UNIQUE(entreprise_id, type, annee))
  INSERT INTO sequence_numeros (entreprise_id, type, annee, compteur)
  VALUES (p_entreprise_id, p_type, v_annee, 1)
  ON CONFLICT (entreprise_id, type, annee)
  DO UPDATE SET compteur = sequence_numeros.compteur + 1
  RETURNING compteur INTO v_compteur;

  RETURN v_prefixe || '-' || v_annee || '-' || LPAD(v_compteur::TEXT, 3, '0');
END; $$ LANGUAGE plpgsql;
```

#### Backend — `routes/factures.js` (POST)

Le numero est genere cote serveur (atomicite via `sequence_numeros`) :

```javascript
const numeroResult = await client.query(
  'SELECT generer_numero($1, $2) AS numero',
  [req.entrepriseId, type || 'facture']
)
const numero = numeroResult.rows[0].numero
```

=> Le frontend n'envoie **jamais** de numero ; il affiche `generer_numero()` cote UI uniquement pour l'apercu,
et le backend le regenere a l'insertion (source de verite unique).

#### Particularite : Recu de caisse

Le recu de casse a un numero propre (`RCA-2026-001`) via sa propre sequence `type = 'recu_caisse'`.
Pas de dependance a une facture cliente.

### 1.1 Migration SQL (`013_devis.sql`)

Commune avec Phase 2 (Devis).

```sql
-- Colonnes TVA/remise sur les lignes
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS taux_tva DECIMAL(5,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS remise_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS montant_ht DECIMAL(15,2) DEFAULT 0;
ALTER TABLE facture_lignes ADD COLUMN IF NOT EXISTS montant_ttc DECIMAL(15,2) DEFAULT 0;

-- Colonnes totaux/ remise sur la facture
ALTER TABLE factures ADD COLUMN IF NOT EXISTS remise_globale DECIMAL(5,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS total_ht DECIMAL(15,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS total_ttc DECIMAL(15,2) DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'FCFA';
```

### 1.2 Backend — `routes/factures.js`

Modifications apportees :

| Action | Detail |
|--------|--------|
| `POST /api/factures` | Accepter les 9 valeurs de `type` (pas seulement "facture"/"devis") |
| Calcul cote serveur | Cascade HT → remise → TVA → TTC avant insertion |
| Enregistrer | `total_ht`, `total_ttc`, `devise`, `template_style` |
| `GET /api/factures` | Retourner les nouvelles colonnes |
| `PUT /api/factures/:id` | Accepter les nouvelles colonnes |

### 1.3 Frontend — `src/components/Facturation/NouvelleFacture.jsx`

Modifications du formulaire existant :

| Element | Modification |
|---------|-------------|
| Selecteur de type | Dropdown avec les 9 types (pas juste Facture/Devis) |
| Titre dynamique | "Nouvelle Facture", "Nouveau Recu de Vente", "Nouveau Bon de Commande", etc. |
| Libelle "Facture a" | Dynamique selon type : "Facture a", "Vendu a", "Livre a", "Client", "Vendeur", etc. |
| Mode Simple/Avance | Toggle qui affiche/masque : Qté, Prix Unit., Echeance, Envoye a |
| Recu de casse | Pas de tableau, champs simples : Recu par, Recu de, Pour, Montant, Methode |
| Selecteur template | Modal avant generation : 6 styles visuels (classique-bleu, classique-blanc, moderne-rouge, mono-noir, orange-militaire, bande-bleu) |
| Selecteur devise | Dropdown : FCFA, EUR, USD, GBP, XOF, etc. |
| Calculs en direct | Sous-total HT, taxes, total TTC visibles pendant la saisie |
| Validation | Les champs obligatoires changent selon le type |

### 1.4 Templates — `src/templates/templateEngine.js`

| Modification | Detail |
|-------------|--------|
| Mode avance | Afficher colonnes Qté, Prix Unit., Echeance, Envoye a |
| `recu_caisse` | Pas de tableau, rendu en texte avec champs simples |
| Devise | `total` + `FCFA` parametrable selon la devise choisie |
| Type-specific fields | `bon_commande` : "Vendeur", `bon_livraison` : "Livre a", etc. |

### 1.5 Traçabilite

- Enregistrer `template_style` et `devise` sur chaque facture
- Onglet "Historique" dans la fiche facture (timeline des statuts)

---

## PHASE 2 — MODULE DEVIS

> **Objectif** : 9 types de devis avec modes de calcul, workflow statuts, conversion en facture.
> **Duree estimee** : 3-4 j

### 2.1 Migration SQL (ajout a `013_devis.sql`)

```sql
-- Table des metadonnees devis
CREATE TABLE IF NOT EXISTS devis_meta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devis_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    type_devis VARCHAR(30) NOT NULL,
    mode_calcul VARCHAR(30),
    surface DECIMAL(15,2),
    taux DECIMAL(15,2),
    duree INTEGER,
    nb_intervenants INTEGER,
    mention VARCHAR(50),
    validite_jours INTEGER DEFAULT 30,
    cree_le TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Generer numero — prefixe DEV

```sql
-- Modifier la fonction pour prefixe_defaut 'DEV'
CREATE OR REPLACE FUNCTION generer_numero(p_entreprise_id UUID, p_type VARCHAR(20))
RETURNS VARCHAR(50) AS $$
DECLARE v_prefixe VARCHAR(10); v_annee INTEGER; v_compteur INTEGER;
BEGIN
  v_annee := EXTRACT(YEAR FROM NOW())::INTEGER;
  IF p_type = 'devis' THEN
    SELECT COALESCE(prefixe_devis, 'DEV') INTO v_prefixe FROM entreprises WHERE id = p_entreprise_id;
  ELSE
    SELECT COALESCE(prefixe_facture, 'FAC') INTO v_prefixe FROM entreprises WHERE id = p_entreprise_id;
  END IF;
  INSERT INTO sequence_numeros (entreprise_id, type, annee, compteur)
  VALUES (p_entreprise_id, p_type, v_annee, 1)
  ON CONFLICT (entreprise_id, type, annee)
  DO UPDATE SET compteur = sequence_numeros.compteur + 1
  RETURNING compteur INTO v_compteur;
  RETURN v_prefixe || '-' || v_annee || '-' || LPAD(v_compteur::TEXT, 3, '0');
END; $$ LANGUAGE plpgsql;
```

### 2.3 Backend — nouvelles routes

| Route | Methode | Role |
|-------|---------|------|
| `POST /api/factures` | POST | Creer devis avec `type = 'devis'` + `devis_meta` |
| `PUT /api/factures/:id/statut` | PUT | Workflow : brouillon → envoye → accepte / refuse |
| `POST /api/devis/:id/convertir` | POST | Creer une facture identique, statut `en_attente` |
| `GET /api/factures?type=devis` | GET | Lister les devis avec meta |

### 2.4 Calcul en cascade (cote serveur)

```
1. Total HT ligne = Quantite × Prix unit HT
2. Sous-total HT = Σ lignes
3. HT net remise = Sous-total × (1 - remise_globale/100)
4. TVA ligne = Total HT ligne × taux_tva/100
5. Total TTC = HT net remise + Σ TVA
```

### 2.5 Frontend — `src/components/Devis/NouveauDevis.jsx` (NOUVEAU)

| Element | Detail |
|---------|--------|
| Selecteur type | 9 types → mode de calcul adapte |
| Forfait | Ligne unique "Montant global du projet" |
| Temps passe | Taux (horaire/journalier) + duree + nb intervenants |
| Metre carre | Surface (m2) + prix/m2 + type travaux |
| Prestations | Tableau (service, duree, livrables, tarif) |
| Travaux BTP | Tableau (materiau, qte, unite, prix) + main-d'oeuvre + securite |
| Commercial | Tableau (produit, qte, prix, remise %) + frais port |
| Estimatif | Mention "Devis estimatif non contractuel" sur le PDF |
| Descriptif | Champ libre description technique + mention |
| Devis-contrat | Mention "Bon pour accord" + zone signature double |
| Calculs en direct | HT → Sous-total → Remise → TVA → TTC |
| Workflow | Boutons statuts (Brouillon, Envoyer, Accepter, Refuser) |
| Convertir | "Convertir en facture" sur les devis acceptes |
| Template + devise | Identique a Phase 1 |

---

## PHASE 3 — MODULE RH

> **Objectif** : fiche employe complete + 14 documents RH generables avec calculs CNPS/IRPP.
> **Duree estimee** : 5-7 j

### 3.1 Migration SQL (`014_rh_profil.sql`)

#### Enrichir la table `employes` (~20 colonnes)

```sql
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
```

#### Tables des documents RH

```sql
-- Documents RH generes (contrat, attestation, certificat, etc.)
CREATE TABLE IF NOT EXISTS rh_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    employe_id UUID NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    type_document VARCHAR(50) NOT NULL,
    titre TEXT,
    variables JSONB,
    pdf_url TEXT,
    statut VARCHAR(20) DEFAULT 'brouillon',
    cree_par UUID, cree_le TIMESTAMP DEFAULT NOW(),
    supprime_le TIMESTAMP
);

-- Ordres de mission
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

-- Notes de frais
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

-- Visites medicales
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

-- Materiel mis a disposition
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
```

### 3.2 Backend — `routes/rh.js` (NOUVEAU)

| Route | Methode | Role |
|-------|---------|------|
| `GET/POST /api/employes` | GET/POST | CRUD employes (enrichi) |
| `PUT /api/employes/:id` | PUT | Modifier employe (20+ champs) |
| `GET/POST /api/rh/documents` | GET/POST | CRUD documents RH |
| `POST /api/rh/documents/:id/generer` | POST | Generer le PDF d'un document |
| `GET/POST /api/rh/missions` | GET/POST | CRUD ordres de mission |
| `GET/POST /api/rh/notes-frais` | GET/POST | CRUD notes de frais |
| `GET/POST /api/rh/visites` | GET/POST | CRUD visites medicales |
| `GET/POST /api/rh/materiel` | GET/POST | CRUD materiel |
| `GET/POST /api/rh/historique-paie` | GET/POST | Historique bulletins |

### 3.3 Calculs RH

```
CNPS salariale = salaire × 4.2%
CNPS patronale = salaire × 8.65%
IRPP (Cameroun) = si salaire > 200 000 FCFA → (salaire - 200 000) × 10%
CAC = salaire × 2.5%
Salaire net = salaire - CNPS - IRPP - CAC
```

### 3.4 Frontend — 14 composants + generateur

| Composant | Champs specifiques |
|-----------|-------------------|
| `FicheIdentification.jsx` | Etat civil + admin (secu, IBAN) + contact urgence + situation pro |
| `ContratTravail.jsx` | CDI/CDD, salaire, poste, date debut, heures, statut cadre |
| `AvenantContrat.jsx` | Contrat parent, modification, date effet |
| `AttestationTravail.jsx` | Nom, date debut, poste, ville, date du jour |
| `CertificatTravail.jsx` | Dates entree/sortie, postes occupes, libre de tout engagement |
| `SoldeToutCompte.jsx` | Salaire prorata, indemnites conges, indemnite rupture, total |
| `BulletinPaie.jsx` | Salaire base + primes - cotisations - impot = NET |
| `OrdreMission.jsx` | Lieu, periode, objet, transport |
| `NoteFrais.jsx` | Liste lignes (date, categorie, description, montant) |
| `DemandeConge.jsx` | Type, dates, nb jours, solde avant/apres, approbation |
| `EntretienAnnuel.jsx` | Bilan, objectifs, formations, commentaires |
| `FicheOnboarding.jsx` | Identite + coordonnees + urgence + secu + IBAN |
| `VisiteMedicale.jsx` | Date, centre, aptitude, restrictions, prochaine visite |
| `RecuMateriel.jsx` | Liste articles (type, marque, numero serie) |

### 3.5 Generateurs PDF

| Fichier | Role |
|---------|------|
| `pdfGeneratorRH.js` | Generateur commun — 14 templates avec variables `{...}` |
| Integre dans chaque composant | Mode apercu + telechargement PDF |

Chaque template suit exactement la structure fournie par l'utilisateur (contrat, avenant, attestation, etc.) avec les variables `{nom_entreprise}`, `{salaire_brut}`, etc. remplacees automatiquement.

### 3.6 Intégration RH.jsx

- Onglet **"Documents RH"** : acces rapide aux 14 types de documents
- Enrichir le formulaire employe avec les 20+ champs
- Historique de paie dans l'onglet "Fiches de paie"

---

## PHASE 4 — RECHERCHE/FILTRES + ARCHIVAGE/HISTORIQUE

> **Objectif** : composant recherche global + tracabilite universelle.
> **Duree estimee** : 3-4 j

### 4.1 Migration SQL (`016_archivage.sql`)

```sql
-- Archives de tous les documents generes
CREATE TABLE IF NOT EXISTS documents_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    module VARCHAR(20) NOT NULL,
    document_id UUID NOT NULL,
    type_document VARCHAR(50),
    numero VARCHAR(50),
    pdf_url TEXT,
    variables JSONB,
    empreinte VARCHAR(64),
    cree_par UUID,
    cree_le TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_archives_entreprise ON documents_archives(entreprise_id);
CREATE INDEX idx_archives_module ON documents_archives(module);

-- Historique des changements de statut
CREATE TABLE IF NOT EXISTS document_historique (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    module VARCHAR(20) NOT NULL,
    document_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    statut_avant VARCHAR(50) DEFAULT '',
    statut_apres VARCHAR(50),
    utilisateur_id UUID,
    details TEXT,
    date TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_historique_module ON document_historique(module, document_id);
```

### 4.2 Backend

| Endpoint | Role |
|----------|------|
| `GET /api/search?q=&module=&statut=&page=&limit=` | Recherche cote SQL (ILIKE) |
| Archiver | Appeler a chaque creation de document valide → inserer dans `documents_archives` + generer hash SHA256 |
| Historique | Appeler a chaque changement de statut → inserer dans `document_historique` |
| `GET /api/archives?module=` | Lister les archives |
| `GET /api/historique?module=&document_id=` | Recuperer l'historique |

### 4.3 Frontend — `src/components/shared/`

| Composant | Detail |
|-----------|--------|
| `RechercheFiltre.jsx` | Barre recherche texte + filtres contextuels par module + tri colonnes + pagination |
| `useRecherche.js` | Hook (debounce 300ms, tri, pagination, persistance session) |
| `TimelineHistorique.jsx` | Timeline visuelle des statuts (timeline-stepper) |
| `ListeArchives.jsx` | Liste des PDF archives avec bouton telecharger + badge empreinte |

Filtres contextuels par module :
- Facture/Devis → statut, type, client, date debut/fin, montant min/max
- RH → type document, employe, statut
- Clients → ville, pays, solde > 0

---

## PHASE 5 — PORTAIL CLIENT (OPTIONNEL — REPORTE)

> **Statut** : non construit au MVP.
> Les donnees (clients, factures, paiements) sont deja exposees par l'API existante. Le portail sera un consommateur de cette API, pas une refonte.
> A declencher quand le socle (Phases0-4) sera valide et que >30-50 clients seront actifs.

---

## MIGRATIONS

| Fichier | Contenu | Phase |
|---------|---------|-------|
| `013_devis.sql` | TVA/remise lignes + totaux + devis_meta | 1 + 2 |
| `015_numerotation.sql` | Colonnes prefixe entreprises + fonction `generer_numero` etendue (10 types) | 1 + 2 |
| `014_rh_profil.sql` | ~20 colonnes employes + tables rh_documents, missions, notes_frais, visites_medicales, materiel_employe | 3 |
| `016_archivage.sql` | documents_archives + document_historique | 4 |

---

## LISTE COMPLETE DES FICHIERSA CREER OU MODIFIER

### Nouveaux fichiers a creer

| Fichier | Phase |
|---------|-------|
| `api/[[...path]].js` | 0 |
| `migrations/013_devis.sql` | 1+2 |
| `migrations/015_numerotation.sql` | 1+2 |
| `migrations/014_rh_profil.sql` | 3 |
| `migrations/016_archivage.sql` | 4 |
| `src/components/Devis/NouveauDevis.jsx` | 2 |
| `src/components/RH/FicheIdentification.jsx` | 3 |
| `src/components/RH/ContratTravail.jsx` | 3 |
| `src/components/RH/AvenantContrat.jsx` | 3 |
| `src/components/RH/AttestationTravail.jsx` | 3 |
| `src/components/RH/CertificatTravail.jsx` | 3 |
| `src/components/RH/SoldeToutCompte.jsx` | 3 |
| `src/components/RH/BulletinPaie.jsx` | 3 |
| `src/components/RH/OrdreMission.jsx` | 3 |
| `src/components/RH/NoteFrais.jsx` | 3 |
| `src/components/RH/DemandeConge.jsx` | 3 |
| `src/components/RH/EntretienAnnuel.jsx` | 3 |
| `src/components/RH/FicheOnboarding.jsx` | 3 |
| `src/components/RH/VisiteMedicale.jsx` | 3 |
| `src/components/RH/RecuMateriel.jsx` | 3 |
| `src/components/RH/pdfGeneratorRH.js` | 3 |
| `src/components/shared/RechercheFiltre.jsx` | 4 |
| `src/components/shared/useRecherche.js` | 4 |
| `src/components/shared/TimelineHistorique.jsx` | 4 |
| `src/components/shared/ListeArchives.jsx` | 4 |

### Fichiers a modifier

| Fichier | Phase |
|---------|-------|
| `package.json` (root) | 0 |
| `vercel.json` | 0 |
| `backend/src/routes/factures.js` | 1 + 2 |
| `src/components/Facturation/NouvelleFacture.jsx` | 1 |
| `src/templates/templateEngine.js` | 1 + 2 |
| `src/components/Facturation/DocumentPreview.jsx` | 1 |
| `src/components/RH/RH.jsx` | 3 |
| `src/utils/api.js` | 3 + 4 |
| `src/App.jsx` (routes) | 2 |

### Fichiers a supprimer

| Fichier | Phase |
|---------|-------|
| `api/auth/login.js` | 0 |
| `api/auth/signup.js` | 0 |
| `api/clients/index.js` | 0 |
| `api/[...slug].js` | 0 |

---

## CHECKLIST DE VERIFICATION

### Phase 0
- [ ] `GET /api/health` → `{"status":"ok"}` sur Vercel
- [ ] Login/signup → JSON valide (pas de HTML)
- [ ] GET clients avec token → JSON
- [ ] Aucune erreur "Unexpected token '<'"

### Phase 1
- [ ] Creer une facture des 9 types → OK
- [ ] PDF genere avec le bon style
- [ ] Recu de casse sans tableau → OK
- [ ] Mode avance avec Qté/Prix Unit → OK
- [ ] Devise FCFA/EUR/USD → OK
- [ ] Historique de statut visible
- [ ] Numero unique par type → FAC-2026-001 / FIS-2026-001 / REC-2026-001 / RCA-2026-001 / BCM-2026-001 / BLV-2026-001 / etc.
- [ ] Aucun numero duplique entre 2 types (sequence separee)

### Phase 2
- [ ] Creer un devis des 9 types → OK
- [ ] Calcul cascade correct (HT → remise → TVA → TTC)
- [ ] Workflow : brouillon → envoye → accepte → OK
- [ ] Bouton "Convertir en facture" → facture creee
- [ ] Numerotation DEV-2026-XXX

### Phase 3
- [ ] Fiche employe avec 20+ champs → OK
- [ ] Generer les 14 documents RH → OK
- [ ] Calcul CNPS 4.2% + 8.65% → OK
- [ ] Calcul IRPP > 200k → OK
- [ ] PDF format camerounais → OK

### Phase 4
- [ ] Recherche texte → retourne des resultats
- [ ] Filtres par module → fonctionnels
- [ ] Archive generee a chaque creation → OK
- [ ] Historique timeline → visible

### Regression
- [ ] Ventes/Stock/Compta toujours fonctionnels
- [ ] Login/Signup toujours fonctionnels
- [ ] Aucune erreur console

---

**STATUT : En attente de "GO" pour commencer la Phase 0.**