# KOLEYA ERP — PLAN DE PROJET COMPLET

**Version :** 2.0
**Date :** 10 aout 2026
**Auteur :** Georges Edimo — CEO & Fondateur
**Statut :** En cours de development

---

## TABLE DES MATIERES

1. [Resume executif](#1-resume-executif)
2. [Analyse du marche](#2-analyse-du-marche)
3. [Architecture technique](#3-architecture-technique)
4. [Modele de donnees (MCD/MLD/MPD/MCV)](#4-modele-de-donnees)
5. [Modules fonctionnels](#5-modules-fonctionnels)
6. [Cas d'utilisation](#6-cas-dutilisation)
7. [Etat actuel du projet](#7-etat-actuel)
8. [Nouvelles fonctionnalites demandees](#8-nouvelles-fonctionnalites)
9. [Plan de travail detaille](#9-plan-de-travail)
10. [Analyse des risques](#10-analyse-des-risques)
11. [Projections financieres](#11-projections-financieres)
12. [Stack technique](#12-stack-technique)

---

## 1. RESUME EXECUTIF

**Koleya** est un ERP SaaS concu pour les PME camerounaises et africaines. Il centralise la facturation, les credits, le stock, les ventes, les achats, la comptabilite, les RH et les notifications dans une seule plateforme accessible depuis un smartphone.

**Probleme :** Les PME camerounaises gerent leurs affaires sur des carnets papier, Excel ou WhatsApp, causant des pertes financieres, des oublis de paiement et un manque de visibilite.

**Solution :** Un ERP tout-en-un avec Mobile Money integre, relances SMS/WhatsApp, et interface 100% francaise.

**Marche :** 200 000+ PME au Cameroun, 850 000+ en Afrique centrale/occidentale.

**Prix :** 5 000 — 20 000 FCFA/mois.

---

## 2. ANALYSE DU MARCHE

### 2.1 Taille du marche

| Pays | PME estimees | Priorite |
|------|-------------|----------|
| Cameroun | 200 000+ | 1 |
| Gabon | 30 000+ | 2 |
| Congo | 25 000+ | 2 |
| Cote d'Ivoire | 80 000+ | 3 |
| Senegal | 60 000+ | 3 |
| Nigeria | 500 000+ | 4 |

### 2.2 Concurrence

| Concurrent | Forces | Faiblesses vs Koleya |
|------------|--------|---------------------|
| Zoho | Maturite, ecosysteme | Pas de Mobile Money, anglais, cher |
| Odoo | Open source, complet | Complexe, pas adapte au contexte local |
| FewBox | Local, commandes restaurant | Uniquement restaurants |
| Excel/carnet | Gratuit, familier | Pas d'automatisation, pas de rapports |

### 2.3 Avantages concurrentiels Koleya

1. **Mobile Money natif** (CinetPay + Flutterwave)
2. **Relances SMS/WhatsApp** automatiques
3. **Interface 100% francaise**
4. **Prix adapte** (5 000 — 20 000 FCFA/mois)
5. **Support local** (Douala)
6. **Agent IA** (pas de concurrent)
7. **Multi-pays** (6 pays des le depart)

---

## 3. ARCHITECTURE TECHNIQUE

### 3.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────┐
│                  VERCEL                          │
│ ┌──────────────┐  ┌──────────────────────────┐ │
│ │   Frontend    │  │  Serverless Functions    │ │
│ │  React+Vite   │  │  17 routes API           │ │
│ │  Tailwind     │  │  JWT Auth                │ │
│ │  Lazy loading │  │  Failover paiements      │ │
│ └──────────────┘  └──────────────────────────┘ │
└────────────────────────┬────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │    Supabase Postgres    │
            │    25 tables            │
            │    Multi-tenant (UUID)  │
            │    Soft delete          │
            │    Backups auto         │
            └─────────────────────────┘
```

### 3.2 Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React | 18.2 |
| Build | Vite | 5.x |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router | 6.x |
| Graphiques | Recharts | 2.10 |
| PDF | jsPDF | 2.5 |
| Icones | lucide-react | 0.294 |
| Backend | Node.js + Express | 22.x / 4.18 |
| BDD | PostgreSQL (Supabase) | 14+ |
| Auth | JWT (bcrypt + jsonwebtoken) | — |
| Paiements | CinetPay + Flutterwave | — |
| SMS | Africa's Talking | — |
| Deploiement | Vercel | — |
| Domaine | .cm ou .com | — |

### 3.3 Flux de donnees

```
Client → Vente → Stock (sortie) → Facture → Paiement → Notification
                ↘ Stock (alerte si rupture)
Fournisseur → Achat → Stock (entree)
Credit client → Relance SMS/WhatsApp → Paiement
```

---

## 4. MODELE DE DONNEES

### 4.1 MCD (Modele Conceptuel)

```
ENTREPRISE ──1,n── UTILISATEUR
ENTREPRISE ──1,n── CLIENT
ENTREPRISE ──1,n── PRODUIT
ENTREPRISE ──1,n── EMPLOYE
ENTREPRISE ──1,n── DEPENSE
ENTREPRISE ──1,n── NOTIFICATION
CLIENT ──1,n── FACTURE
CLIENT ──1,n── CREDIT
CLIENT ──1,n── VENTE
FACTURE ──1,n── FACTURE_LIGNE
VENTE ──1,n── VENTE_LIGNE
ACHAT ──1,n── ACHAT_LIGNE
CREDIT ──1,n── CREDIT_PAIEMENT
PRODUIT ──0,n── VENTE_LIGNE
PRODUIT ──0,n── ACHAT_LIGNE
PRODUIT ──0,n── MOUVEMENT_STOCK
```

### 4.2 MLD (Modele Logique)

| Table | Cles | Champs cles |
|-------|------|-------------|
| ENTREPRISE | PK id | nom, plan, devise, actif |
| UTILISATEUR | PK id, FK entreprise | email, mdp, role, est_super_admin |
| CLIENT | PK id, FK entreprise | nom, telephone, solde |
| FACTURE | PK id, FK entreprise, FK client | numero, type, statut, total, paye, reste |
| FACTURE_LIGNE | PK id, FK facture | description, qte, prix, total |
| VENTE | PK id, FK entreprise, FK client | numero, statut, mt_total, mt_paye, reste |
| VENTE_LIGNE | PK id, FK vente, FK produit | description, qte, prix, total |
| ACHAT | PK id, FK entreprise | fournisseur, numero, statut, mt_total |
| ACHAT_LIGNE | PK id, FK achat, FK produit | description, qte, prix, total |
| CREDIT | PK id, FK entreprise, FK client | montant_total, reste, statut |
| CREDIT_PAIEMENT | PK id, FK credit | montant, methode, date |
| PRODUIT | PK id, FK entreprise | nom, reference, stock, prix_achat, prix_vente |
| MOUVEMENT_STOCK | PK id, FK entreprise, FK produit | type_mvt, qte, motif |
| EMPLOYE | PK id, FK entreprise | nom, poste, salaire, statut |
| DEPENSE | PK id, FK entreprise | categorie, montant, date |
| NOTIFICATION | PK id, FK entreprise | canal, destinataire, message, statut |
| DOCUMENT | PK id, FK entreprise | nom_fichier, type, categorie, chemin |
| SEQUENCE_NUMEROS | PK id, FK entreprise | type, annee, compteur |

### 4.3 MPD (PostgreSQL)

- **25 tables** au total
- **Cles primaires :** UUID (multi-tenant securise)
- **Cles etrangeres :** ON DELETE CASCADE
- **Index :** 35+ sur les colonnes frequentes
- **Soft delete :** supprime_le + supprime_par sur les tables metier
- **Audit trail :** cree_le + mis_a_jour_le
- **Fonction :** generer_numero() pour la numerotation auto

### 4.4 MCV (Vues)

| Vue | Description |
|-----|-------------|
| v_factures | Factures + info client |
| v_credits_en_retard | Credits en retard |
| v_alertes_stock | Produits sous le seuil min |

---

## 5. MODULES FONCTIONNELS

| # | Module | Backend | Frontend | Statut |
|---|--------|---------|----------|--------|
| 1 | Authentification | ✅ | ✅ | A ameliorer (2FA, Gmail, reset MDP) |
| 2 | Facturation | ✅ | ✅ | A ameliorer (clients/entreprises, PDF pro) |
| 3 | Devis | ✅ | ✅ | OK |
| 4 | Credits | ✅ | ✅ | OK |
| 5 | Ventes | ✅ | ❌ | Frontend a creer |
| 6 | Achats | ✅ | ❌ | Frontend a creer |
| 7 | Stock | ✅ | ✅ | A ameliorer (photos, QR codes) |
| 8 | Comptabilite | ⚠️ Partiel | ✅ | Routes double entree manquantes |
| 9 | RH | ⚠️ Partiel | ✅ | Routes contrats/conges manquantes |
| 10 | Notifications | ✅ | ✅ | A connecter au vrai SMS |
| 11 | Paiements | ✅ Service | ❌ | A connecter (CinetPay/Stripe) |
| 12 | Documents | ❌ | ❌ | A creer completement |
| 13 | Rapports | ✅ | ✅ | OK |
| 14 | Portail Client | ✅ | ✅ | OK |
| 15 | Admin | ✅ | ✅ | OK |
| 16 | Agent IA | ❌ | ❌ | A creer |

---

## 6. CAS D'UTILISATION

### 6.1 Utilisateurs et roles

| Role | Perimetre | Droits |
|------|-----------|--------|
| super_admin | Toute la plateforme | CRUD total, restauration, admin panel |
| proprietaire | Son entreprise | Acces complet |
| admin | Son entreprise | Presque complet, pas de parametres |
| comptable | Son entreprise | Facturation, credits, depenses, rapports |
| employe | Son entreprise | Lecture seule |

### 6.2 Cas d'utilisation principaux (33)

| CU | Description | Priorite |
|----|-------------|----------|
| CU-01 | S'inscrire | P0 |
| CU-02 | Se connecter | P0 |
| CU-03 | Se connecter par SMS | P0 |
| CU-04 | Creer une facture | P0 |
| CU-05 | Enregistrer un paiement | P0 |
| CU-06 | Generer PDF | P0 |
| CU-07 | Creer un devis | P0 |
| CU-08 | Convertir devis→facture | P0 |
| CU-09 | Enregistrer un credit | P0 |
| CU-10 | Payer un credit | P0 |
| CU-11 | Relancer par SMS | P1 |
| CU-12 | Enregistrer une vente | P0 |
| CU-13 | Payer une vente | P0 |
| CU-14 | Enregistrer un achat | P0 |
| CU-15 | Ajouter un produit | P0 |
| CU-16 | Ajuster le stock | P0 |
| CU-17 | Consulter alertes stock | P0 |
| CU-18 | Enregistrer une depense | P1 |
| CU-19 | Consulter bilan | P1 |
| CU-20 | Ajouter un employe | P1 |
| CU-21 | Generer fiche de paie | P1 |
| CU-22 | Envoyer SMS/WhatsApp | P1 |
| CU-23 | Relances automatiques | P1 |
| CU-24 | Paiement Mobile Money | P1 |
| CU-25 | Gerer entreprises (admin) | P1 |
| CU-26 | Restaurer elements | P1 |
| CU-27 | Creer utilisateurs (admin) | P1 |
| CU-28 | Consulter factures (client) | P2 |
| CU-29 | Payer facture (client) | P2 |
| CU-30 | Bilan financier | P2 |
| CU-31 | Aging clients | P2 |
| CU-32 | Top clients | P2 |
| CU-33 | Agent IA | P2 |

---

## 7. ETAT ACTUEL DU PROJET

### 7.1 Fichiers

| Repertoire | Fichiers | Statut |
|------------|----------|--------|
| backend/src/routes/ | 17 fichiers | ✅ Complets |
| backend/src/services/ | 2 fichiers | ✅ OK |
| backend/src/middleware/ | 3 fichiers | ✅ OK |
| backend/migrations/ | 12 fichiers SQL | ⚠️ A nettoyer |
| src/components/ | 18 modules | ✅ Complets |
| src/contexts/ | 4 fichiers | ✅ OK |
| src/utils/ | 1 fichier (api.js) | ✅ OK |
| **Total** | **~60 fichiers** | |

### 7.2 Ce qui fonctionne

| Module | Fonctionnel | Commentaire |
|--------|:-----------:|-------------|
| Auth (email/MDP/SMS) | ✅ | JWT + refresh tokens |
| Facturation + Devis | ✅ | PDF avec logo/cachet |
| Credits clients | ✅ | Paiements partiels |
| Stock basique | ✅ | CRUD + alertes |
| Ventes/Achats | ✅ | Backend complet |
| Notifications | ⚠️ | Simulation en dev |
| Admin | ✅ | CRUD + restauration |
| Rapports | ✅ | Graphiques + export |
| Portail Client | ✅ | Consultation + paiement |

### 7.3 Ce qui ne fonctionne pas encore

| Probleme | Impact |
|----------|--------|
| Frontend non connecte au backend | Donnees en localStorage uniquement |
| Pas de vrai SMS/WhatsApp | Notifications simulees |
| Paiements non connectes | CinetPay/Stripe pas configures |
| Pas de tests | Risque de regressions |
| Pas de deploiement | App pas accessible en ligne |

---

## 8. NOUVELLES FONCTIONNALITES DEMANDEES

| # | Fonctionnalite | Module | Effort | Priorite |
|---|---------------|--------|--------|----------|
| 1 | Paiements bancaires (Stripe) | Paiements | 2j | P0 |
| 2 | Paiement par preuves (upload recu) | Paiements | 1j | P0 |
| 3 | 2FA (double facteur SMS) | Auth | 2j | P0 |
| 4 | Inscription via Gmail (OAuth2) | Auth | 1j | P1 |
| 5 | Reset MDP par email + confirm SMS | Auth | 2j | P0 |
| 6 | Factures clients vs entreprises | Facturation | 1j | P1 |
| 7 | Factures achat (frontend) | Achats | 1j | P0 |
| 8 | Photos de produits | Stock | 1j | P1 |
| 9 | QR Codes produits | Stock | 1j | P1 |
| 10 | Mise en forme PDF professionnelle | PDF | 2j | P1 |
| 11 | Module Documents complet | Documents | 1j | P1 |

---

## 9. PLAN DE TRAVAIL

### Sprint 1 : Authentification renforcee (3 jours)

| # | Tache | Effort | Depend de |
|---|-------|--------|-----------|
| 1.1 | Inscription via Gmail (OAuth2 Google) | 1j | — |
| 1.2 | 2FA (code SMS apres connexion) | 1j | — |
| 1.3 | Reset MDP par email + confirmation SMS | 1j | — |

**Livrables :**
- Connexion Gmail fonctionnelle
- 2FA active sur tous les comptes
- Reset MDP via lien email + code SMS

### Sprint 2 : Paiements (3 jours)

| # | Tache | Effort | Depend de |
|---|-------|--------|-----------|
| 2.1 | Paiements bancaires (Stripe Checkout) | 1j | — |
| 2.2 | Paiement par preuves (upload recu) | 1j | — |
| 2.3 | Frontend Module Ventes | 1j | — |

**Livrables :**
- Paiement par carte bancaire via Stripe
- Upload de preuve de paiement (photo du recu)
- Page Ventes fonctionnelle

### Sprint 3 : Documents + Stock (3 jours)

| # | Tache | Effort | Depend de |
|---|-------|--------|-----------|
| 3.1 | Module Documents (migration + backend + frontend) | 1j | — |
| 3.2 | Photos de produits (upload + gallery) | 1j | — |
| 3.3 | QR Codes produits (generation + affichage) | 1j | — |

**Livrables :**
- Upload et listing de documents
- Photos de produits dans la fiche produit
- QR codes generes automatiquement

### Sprint 4 : Facturation avancee + PDF pro (3 jours)

| # | Tache | Effort | Depend de |
|---|-------|--------|-----------|
| 4.1 | Factures clients vs entreprises | 1j | — |
| 4.2 | Factures achat (frontend) | 1j | — |
| 4.3 | Mise en forme PDF professionnelle | 1j | — |

**Livrables :**
- Distinction facture client / facture entreprise
- Page Achats fonctionnelle
- PDF avec en-tete soigne, pied de page, mentions legales

### Sprint 5 : Tests + Deploiement (3 jours)

| # | Tache | Effort | Depend de |
|---|-------|--------|-----------|
| 5.1 | Tests de tous les modules | 1j | Sprints 1-4 |
| 5.2 | Deploiement Vercel + Supabase | 1j | — |
| 5.3 | Configuration paiements (CinetPay/Stripe) | 1j | — |

**Livrables :**
- Application en ligne sur koleya.cm
- Paiements fonctionnels
- Tests passes

**Total : 15 jours (3 semaines)**

---

## 10. ANALYSE DES RISQUES

| Risque | Probabilite | Impact | Mitigation |
|--------|:-----------:|:------:|------------|
| Faille de securite | Moyen | Critique | Validation, HTTPS, JWT, rate limiting |
| Perte de donnees | Faible | Critique | Backup Supabase + export JSON |
| Faible adoption | Eleve | Critique | Beta test + formation + support local |
| Concurrent entre | Eleve | Moyen | Se differencier par le local |
| Indisponibilite BDD | Faible | Eleve | Supabase = 99.9% SLA |
| Depassement budget | Moyen | Eleve | MVP d'abord, features ensuite |
| Notifications non delivrees | Moyen | Moyen | Fallback email + retry |

---

## 11. PROJECTIONS FINANCIERES

### 11.1 Investissements

| Poste | Cout |
|-------|------|
| Developpement (6 semaines) | 8 000 000 FCFA |
| Infrastructure (an 1) | 600 000 FCFA |
| Domaine | 15 000 FCFA/an |
| Marketing (lancement) | 1 000 000 FCFA |
| **Total** | **~10 000 000 FCFA** |

### 11.2 Revenus projetes

| Mois | Clients | MRR (FCFA) | Cumul |
|------|---------|-----------|-------|
| M3 | 20 | 150 000 | 450 000 |
| M6 | 80 | 600 000 | 2 250 000 |
| M9 | 150 | 1 125 000 | 5 625 000 |
| M12 | 250 | 1 875 000 | 14 062 500 |

### 11.3 Couts mensuels

| Service | Cout |
|---------|------|
| Vercel (frontend + API) | 0 FCFA |
| Supabase (BDD) | 0 FCFA (500 Mo gratuit) |
| Domaine | ~1 250 FCFA/mois |
| CinetPay | ~2% par transaction |
| **Total fixe** | **~1 250 FCFA/mois** |

---

## 12. STACK TECHNIQUE DETAILLEE

### Frontend

| Technologie | Version | Role |
|-------------|---------|------|
| React | 18.2 | UI Library |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.4 | Styling |
| React Router | 6.x | Routing |
| Recharts | 2.10 | Graphiques |
| jsPDF | 2.5 | PDF client |
| lucide-react | 0.294 | Icones |

### Backend

| Technologie | Version | Role |
|-------------|---------|------|
| Node.js | 22.x | Runtime |
| Express | 4.18 | Framework HTTP |
| pg | 8.11 | Client PostgreSQL |
| bcryptjs | 2.4 | Hashing MDP |
| jsonwebtoken | 9.0 | Auth JWT |
| helmet | 7.1 | Securite HTTP |

### Base de donnees

| Technologie | Role |
|-------------|------|
| Supabase (PostgreSQL 14+) | BDD + backups auto + SSL |
| UUID | Cles primaires (multi-tenant) |
| JSONB | Donnees flexibles |
| Soft delete | Audit trail |

### Infrastructure

| Composant | Solution | Cout |
|-----------|----------|------|
| Frontend + Backend | Vercel | Gratuit |
| BDD | Supabase | Gratuit (500 Mo) |
| Domaine | .cm | ~15 000 FCFA/an |
| Paiements | CinetPay + Stripe | ~2-3% par transaction |
| SMS | Africa's Talking | ~50 FCFA/SMS |

---

## 13. CONTACT

| Role | Nom | Email |
|------|-----|-------|
| CEO & Fondateur | Georges Edimo | georgese66@gmail.com |
| Support | Koleya | support@koleya.cm |
| Technique | Dev Team | dev@koleya.cm |

---

**Ce document est vivant et sera mis a jour a chaque sprint.**
