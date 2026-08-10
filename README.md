# Koleya — ERP PME (SaaS)

ERP multi-tenant en français pour les PME camerounaises : facturation, devis, crédits clients,
stock, comptabilité, RH & paie, notifications. React (frontend) + Express/Node (API) + PostgreSQL.

## Démarrage en développement

```bash
# 1. Backend (PostgreSQL requis, base "koleya")
cd backend
cp .env.example .env            # adapter DB_PASSWORD, JWT_SECRET
npm install
npm run setup                    # crée rôle + base + migrations + compte démo (mot de passe postgres demandé)
npm run dev                      # API sur http://localhost:3001

# 2. Frontend
cd ..
npm install
npm run dev                      # sur http://localhost:5173
```

Comptes de démonstration :
- Client : `admin@koleya.com` / `admin123`
- Super administrateur (plateforme) : `superadmin@koleya.cm` / `admin123`

## Essai gratuit 7 jours & quotas

- À l'inscription, l'entreprise reçoit un **essai gratuit de 7 jours**.
- Pendant l'essai : quotas **10 factures, 5 clients, 3 produits, 1 utilisateur** ;
  **SMS/WhatsApp et notifications bloqués**.
- **Jour 7** : passage en **lecture seule**, **export PDF désactivé**, bannière persistante,
  compte à rebours et redirection vers la page « Choisir un plan ».
- Le paiement est un **mock** (`POST /api/abonnement/payer`) qui active le plan et remet
  les compteurs à zéro. Un prestataire réel (Mobile Money / carte) sera intégré.
- **Super admin** : `superadmin@koleya.cm` voit toutes les entreprises et peut **restaurer**
  les éléments supprimés (soft delete) via `/app/admin`.

## Déploiement Docker

### Staging (Docker Desktop / HTTP local)

```bash
cp docker.env.example .env.docker    # puis remplir les secrets (DB_PASSWORD, JWT_SECRET)
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.staging.yml up -d --build
# Accès : http://localhost:8080
```

### Production (VPS Linux + HTTPS automatique via Caddy)

Prérequis : le domaine (ex. `koleyaapp.cm`) pointe vers l'IP du VPS ; ports 80/443 ouverts.

```bash
cp docker.env.example .env.docker    # CORS_ORIGIN=https://koleyaapp.cm, DOMAIN=koleyaapp.cm
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Caddy génère et renouvelle automatiquement le certificat Let's Encrypt.

## Sauvegarde / restauration

```bash
./deploy/backup.sh              # → backups/koleya_backup_<date>.sql.gz
./deploy/restore.sh backups/xxx.sql.gz
```

## Sécurité (mise en production)

- `NODE_ENV=production` + secrets injectés via `.env.docker` (jamais codés en dur, `.env` exclu des images).
- Le backend **refuse de démarrer** si `JWT_SECRET` manque ou reste celui de dev.
- helmet + CSP, CORS restreint, rate limiting (global + auth), `trust proxy` derrière Nginx/Caddy.
- Refresh tokens **hashés (sha256)** en base, **rotation** à chaque rafraîchissement, **révocation** au logout.
- Validation des entrées (**zod**) sur toutes les routes d'écriture.
- **Transactions** (facture + lignes, paiement de crédit) pour éviter tout état partiel sous charge.
- Soft delete sur les entités principales → restauration possible par le super admin.
- Conteneurs **non-root**, healthchecks, `restart: unless-stopped`, arrêt gracieux.

## Architecture

| Service | Rôle |
|---|---|
| `db` | PostgreSQL 17 (volume persisté, 200 connexions max) |
| `migrate` | Exécute les migrations SQL 001 → 004 (one-shot) |
| `backend` | API Express sur `:3001` (JWT, abonnements, quotas, admin) |
| `frontend` | Build Vite servi par Nginx, reverse-proxy `/api` → backend |
| `caddy` (prod) | HTTPS automatique, compression, en-têtes de sécurité |
