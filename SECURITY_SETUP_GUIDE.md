# 🔐 GUIDE DE CONFIGURATION SÉCURISÉE DES AGENTS

**Date** : 22 août 2026  
**⚠️ IMPORTANT** : Ce guide explique comment configurer les agents de manière SÉCURISÉE

---

## 🚨 RÈGLES DE SÉCURITÉ ABSOLUES

### ❌ NE JAMAIS FAIRE
- ❌ Partager des tokens en clair dans le chat
- ❌ Commiter des secrets sur Git
- ❌ Stocker des secrets en code dur
- ❌ Utiliser des tokens avec permissions trop larges
- ❌ Réutiliser les mêmes tokens partout

### ✅ TOUJOURS FAIRE
- ✅ Utiliser des variables d'environnement
- ✅ Ajouter `.env*` au `.gitignore`
- ✅ Permissions minimales (principle of least privilege)
- ✅ Rotation régulière des tokens (tous les 90 jours)
- ✅ MFA activé sur tous les services
- ✅ Audit trail des accès

---

## 📋 ÉTAPE PAR ÉTAPE (MÉTHODE SÉCURISÉE)

### Étape 1 : Révoque les tokens compromis ⚠️

**GitHub** :
```bash
# 1. Aller sur https://github.com/settings/tokens
# 2. Trouver le token commençant par ghp_uQQo...
# 3. Cliquer "Delete"
# 4. Créer un nouveau token avec SEULEMENT ces permissions :
#    - repo (Full control of private repositories)
#    - workflow (Update GitHub Action workflows)
```

**Vercel** :
```bash
# 1. Aller sur https://vercel.com/account/tokens
# 2. Trouver le token commençant par vck_1R7i...
# 3. Cliquer "Delete"
# 4. Créer un nouveau token
```

**Supabase** :
```bash
# 1. Aller sur https://supabase.com/dashboard/project/etkguxaroezjywrujfom/settings/api
# 2. "Regenerate" le service_role key
# 3. Copier le nouveau token (vous ne pourrez plus le revoir)
```

### Étape 2 : Copier le fichier template

```bash
cd "C:\Users\DadaSyst\Desktop\MES SAAS\SaaS-14-Facturation-PME"

# Copier le template
cp .env.agents.example .env.agents

# Ajouter au .gitignore (pour ne JAMAIS le commiter)
echo ".env.agents" >> .gitignore
```

### Étape 3 : Remplir `.env.agents` avec VOS NOUVEAUX tokens

```bash
# Ouvrir le fichier
code .env.agents

# Remplir UNIQUEMENT ces variables pour commencer :
GITHUB_TOKEN=ghp_VOTRE_NOUVEAU_TOKEN
GITHUB_REPO_OWNER=votre-username
GITHUB_REPO_NAME=Koleya-ERP-PME-v1.0

VERCEL_TOKEN=VOTRE_NOUVEAU_TOKEN
VERCEL_PROJECT_ID=prj_5MDabpICxLjcdVtCd0k42VgJcsoZ

SUPABASE_URL=https://etkguxaroezjywrujfom.supabase.co
SUPABASE_SERVICE_ROLE_KEY=VOTRE_NOUVEAU_TOKEN
```

### Étape 4 : Tester la configuration

```bash
# Charger les variables d'environnement
source .env.agents  # Linux/Mac
# OU
set -a; source .env.agents; set +a  # Linux/Mac
# OU sur Windows PowerShell :
Get-Content .env.agents | foreach {
  $name, $value = $_.split('=')
  if ($name -and $value) {
    Set-Item -Path "env:$name" -Value $value
  }
}

# Tester GitHub
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Tester Vercel
curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID
```

### Étape 5 : Configuration des agents

Maintenant que les secrets sont stockés de manière sécurisée, les agents peuvent les utiliser via :

```javascript
// Les agents lisent depuis process.env
const githubToken = process.env.GITHUB_TOKEN;
const vercelToken = process.env.VERCEL_TOKEN;

// Jamais hardcodé !
```

---

## 🔒 PERMISSIONS MINIMALES PAR SERVICE

### GitHub Token Permissions
```yaml
Permissions requises:
  ✅ repo (full control)
  ✅ workflow (update workflows)
  ❌ admin:org (PAS besoin)
  ❌ delete_repo (PAS besoin)
```

### Vercel Token Permissions
```yaml
Scopes:
  ✅ Deployments (create, read)
  ✅ Projects (read)
  ✅ Logs (read)
  ❌ Account (PAS besoin)
  ❌ Billing (PAS besoin)
```

### Supabase Permissions
```yaml
Tokens:
  - service_role : Admin (pour migrations)
  - anon : Public read/write (pour app)
  
⚠️ Utilisez service_role SEULEMENT pour migrations
⚠️ Jamais exposer service_role côté client
```

---

## 🛡️ MÉTHODE ALTERNATIVE : Doppler (Recommandé)

Au lieu de gérer `.env.agents` manuellement, utilisez **Doppler** :

### Setup Doppler
```bash
# 1. Créer un compte sur https://doppler.com
# 2. Installer Doppler CLI
curl -Ls https://cli.doppler.com/install.sh | sh

# 3. Login
doppler login

# 4. Setup project
doppler setup

# 5. Ajouter vos secrets via l'UI Doppler
# https://dashboard.doppler.com

# 6. Les agents utilisent Doppler
doppler run -- npm start
```

**Avantages Doppler** :
- ✅ Secrets centralisés (pas de .env files)
- ✅ Rotation automatique
- ✅ Audit trail complet
- ✅ Sync vers tous les environnements
- ✅ Team collaboration sécurisé

---

## 🔍 VÉRIFICATION DE SÉCURITÉ

### Checklist avant de continuer
```bash
# 1. Les anciens tokens sont révoqués ?
- [ ] GitHub token ghp_uQQo... révoqué
- [ ] Vercel token vck_1R7i... révoqué
- [ ] Supabase token sbp_1f08... régénéré

# 2. .env.agents est protégé ?
- [ ] .env.agents existe localement
- [ ] .env.agents dans .gitignore
- [ ] .env.agents JAMAIS commité sur Git

# 3. Nouveaux tokens créés ?
- [ ] Nouveau GitHub token créé
- [ ] Nouveau Vercel token créé
- [ ] Nouveau Supabase token créé

# 4. Permissions minimales ?
- [ ] GitHub : repo + workflow uniquement
- [ ] Vercel : deployments + projects uniquement
- [ ] Supabase : service_role pour backend seulement

# 5. MFA activé ?
- [ ] GitHub MFA activé
- [ ] Vercel MFA activé
- [ ] Supabase MFA activé
```

---

## 🚀 PROCHAINE ÉTAPE

Une fois que vous avez :
1. ✅ Révoqué les anciens tokens
2. ✅ Créé de nouveaux tokens (avec permissions minimales)
3. ✅ Rempli `.env.agents` localement
4. ✅ Vérifié que `.env.agents` est dans `.gitignore`

**ALORS** dites-moi simplement :

> "✅ Les tokens sont configurés de manière sécurisée"

Et je pourrai :
- Tester les connexions
- Configurer les agents pour utiliser ces services
- Créer des workflows automatisés
- Tout cela **SANS voir vos tokens** 🔐

---

## 📞 BESOIN D'AIDE ?

Si vous avez des questions sur :
- Comment créer un token avec les bonnes permissions
- Comment utiliser Doppler
- Comment vérifier que tout est sécurisé

Demandez-moi et je vous guide étape par étape !

---

**Sécurité avant tout.** 🔐