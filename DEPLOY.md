# DEPLOIEMENT KOLEYA ERP

## Etape 1 — Tester le build sur ton PC

```bash
cd "C:\Users\DadaSyst\Desktop\MES SAAS\SaaS-14-Facturation-PME"

# Installer les dependances
npm install

# Tester le build
npm run build

# Lancer les tests
npm test -- --run

# Lancer le serveur de dev
npm run dev
```

Si `npm run build` genere un dossier `dist/`, le build est OK.

## Etape 2 — Executer les migrations SQL

Sur ton PC, ouvre le dossier du projet et lance :

```bash
# Ouvrir psql avec l'URL Supabase
psql "postgresql://postgres:ARLette9401@@@db.jxobrnusdxxqjvhfznwn.supabase.co:5432/postgres"

# Puis dans psql, execute chaque fichier :
\i backend/migrations/001_init.sql
\i backend/migrations/002_notifications.sql
\i backend/migrations/003_seed_demo.sql
\i backend/migrations/004_abonnements_softdelete.sql
\i backend/migrations/004_stock_avance.sql
\i backend/migrations/005_comptabilite_complete.sql
\i backend/migrations/005_documents.sql
\i backend/migrations/006_rh_avance.sql
\i backend/migrations/007_multi_pays.sql
\i backend/migrations/008_api_publique.sql
\i backend/migrations/009_paiements.sql
\i backend/migrations/010_2fa_gmail.sql
\i backend/migrations/011_paiements_avances.sql
\i backend/migrations/012_champs_documents.sql
```

Ou directement dans le SQL Editor de Supabase (console.supabase.com).

## Etape 3 — Push sur GitHub

```bash
cd "C:\Users\DadaSyst\Desktop\MES SAAS\SaaS-14-Facturation-PME"
git init
git add .
git commit -m "feat: Koleya ERP v2.0 — complet"
git remote add origin https://github.com/TON_UTILISATEUR/koleya-erp.git
git branch -M main
git push -u origin main
```

## Etape 4 — Deploier sur Vercel

1. Va sur **vercel.com** → **"Import Git Repository"**
2. Selectionne `koleya-erp`
3. Configure :
   - Framework: **Vite**
   - Build Command: **npm run build**
   - Output Directory: **dist**
4. Variables d'environnement :
   ```
   DATABASE_URL=postgresql://postgres:ARLette9401@@@db.jxobrnusdxxqjvhfznwn.supabase.co:5432/postgres
   JWT_SECRET=koleya-secret-2026-change-in-production
   CORS_ORIGIN=https://koleya-erp.vercel.app
   APP_URL=https://koleya-erp.vercel.app
   FRONTEND_URL=https://koleya-erp.vercel.app
   ```
5. Clique sur **"Deploy"**

## Etape 5 — Tester

1. Ouvre `https://koleya-erp.vercel.app`
2. Connecte-toi avec `admin@koleya.com` / `admin123`
3. Verifie que chaque module fonctionne

## Comptes de test

| Email | Mot de passe | Role |
|-------|-------------|------|
| admin@koleya.com | admin123 | Proprietaire (demo) |
| superadmin@koleya.cm | admin123 | Super admin |

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| DATABASE_URL | URL PostgreSQL Supabase | postgresql://... |
| JWT_SECRET | Secret JWT (fort) | openssl rand -hex 32 |
| CORS_ORIGIN | URL du frontend | https://koleya-erp.vercel.app |
| APP_URL | URL du backend | https://koleya-erp.vercel.app |
| FRONTEND_URL | URL du frontend | https://koleya-erp.vercel.app |
| STRIPE_SECRET_KEY | Cle secrete Stripe (prod) | sk_live_... |
| CINETPAY_APP_ID | ID application CinetPay | ... |
| CINETPAY_API_KEY | Cle API CinetPay | ... |
