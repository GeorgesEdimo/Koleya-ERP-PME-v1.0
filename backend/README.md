# Koleya Backend — API Node.js/Express + PostgreSQL

## Prérequis

- Node.js 18+
- PostgreSQL 14+

## Installation

```bash
cd backend
npm install
```

## Configuration

```bash
cp .env.example .env
# Modifier les valeurs dans .env
```

## Base de données

```bash
# Tout en une commande : crée le rôle + la base (si absents),
# exécute les migrations et insère le compte de démonstration.
npm run setup
```

Le script `setup` se connecte en superutilisateur `postgres` : psql vous demandera
son mot de passe. Il crée le rôle `koleya` et la base `koleya`, puis `npm run migrate`
exécute les migrations `001_init.sql`, `002_notifications.sql` et `003_seed_demo.sql`.

Compte de démonstration créé par le seed : `admin@koleya.com` / `admin123`

## Démarrage

```bash
# Development
npm run dev

# Production
npm start
```

L'API tourne sur `http://localhost:3001`

## Endpoints

### Auth
- `POST /api/auth/signup` — Inscription
- `POST /api/auth/login` — Connexion
- `POST /api/auth/refresh` — Rafraîchir le token
- `POST /api/auth/logout` — Déconnexion
- `GET /api/auth/me` — Profil utilisateur

### Clients
- `GET /api/clients` — Liste
- `POST /api/clients` — Créer
- `PUT /api/clients/:id` — Modifier
- `DELETE /api/clients/:id` — Supprimer

### Factures/Devis
- `GET /api/factures` — Liste (params: type, statut)
- `GET /api/factures/:id` — Détail
- `POST /api/factures` — Créer
- `PUT /api/factures/:id` — Modifier
- `DELETE /api/factures/:id` — Supprimer

### Crédits
- `GET /api/credits` — Liste
- `POST /api/credits` — Créer
- `POST /api/credits/:id/paiement` — Enregistrer paiement
- `DELETE /api/credits/:id` — Supprimer

### Produits
- `GET /api/produits` — Liste (params: categorie, alertes)
- `POST /api/produits` — Créer
- `PUT /api/produits/:id` — Modifier
- `PUT /api/produits/:id/stock` — Ajuster stock
- `DELETE /api/produits/:id` — Supprimer

### Employés
- `GET /api/employes` — Liste
- `POST /api/employes` — Créer
- `PUT /api/employes/:id` — Modifier
- `DELETE /api/employes/:id` — Supprimer

### Dépenses
- `GET /api/depenses` — Liste
- `POST /api/depenses` — Créer
- `DELETE /api/depenses/:id` — Supprimer

### Stats
- `GET /api/stats/dashboard` — Statistiques tableau de bord
- `GET /api/stats/entreprise` — Info entreprise
- `PUT /api/stats/entreprise` — Modifier entreprise

### Notifications
- `GET /api/notifications` — Historique
- `POST /api/notifications/envoyer` — Envoi manuel
- `POST /api/notifications/relance-facture/:id` — Relancer facture
- `POST /api/notifications/rappel-credit/:id` — Rappeler crédit
- `POST /api/notifications/relances-auto` — Relances automatiques

### Stock avancé
- `GET /api/stock-avance/depots` — Liste des dépôts
- `POST /api/stock-avance/depots` — Créer dépôt
- `GET /api/stock-avance/mouvements` — Historique mouvements
- `POST /api/stock-avance/mouvement` — Enregistrer mouvement
- `POST /api/stock-avance/transfert` — Transfert inter-dépôts

### Comptabilité
- `GET /api/comptabilite/plan-comptable` — Plan comptable
- `POST /api/comptabilite/ecriture` — Nouvelle écriture (double entrée)
- `GET /api/comptabilite/balance` — Balance comptable
- `GET /api/comptabilite/grand-livre` — Grand livre
- `GET /api/comptabilite/tva` — Situation TVA

### Paiements (CinetPay + Flutterwave)
- `POST /api/paiements/creer` — Initier un paiement Mobile Money/Carte
- `GET /api/paiements/verifier/:transaction_id` — Vérifier statut
- `GET /api/paiements/historique` — Historique des paiements
- `POST /api/paiements/callback/cinetpay` — Webhook CinetPay
- `POST /api/paiements/callback/flutterwave` — Webhook Flutterwave

### Expansion géographique
Pays supportés : Cameroun (XAF), Gabon (XAF), Congo (XAF), Côte d'Ivoire (XOF), Sénégal (XOF), Nigeria (NGN)

### Configuration Paiements
```env
# CinetPay (Principal) — https://docs.cinetpay.com
CINETPAY_APP_ID=xxx
CINETPAY_API_KEY=xxx
CINETPAY_SITE_ID=xxx

# Flutterwave (Backup) — https://developer.flutterwave.com
FLUTTERWAVE_SECRET_KEY=xxx
FLUTTERWAVE_PUBLIC_KEY=xxx
```

L'architecture utilise un **failover automatique** : si CinetPay est indisponible, le paiement bascule sur Flutterwave.
