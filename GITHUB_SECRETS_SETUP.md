# 🔐 Configuration GitHub Secrets - Guide Rapide

## Étape 1: Aller dans les paramètres du repo

URL directe: https://github.com/GeorgesEdimo/Koleya-ERP-PME-v1.0/settings/secrets/actions

## Étape 2: Créer ces 3 secrets (minimum)

Cliquez sur **"New repository secret"** pour chaque:

### Secret 1: AGENT_GITHUB_TOKEN
```
Name: AGENT_GITHUB_TOKEN
Secret: [Coller votre token depuis .env.agents.local]
```

### Secret 2: AGENT_VERCEL_TOKEN
```
Name: AGENT_VERCEL_TOKEN
Secret: [Coller votre Vercel token depuis .env.agents.local]
```

### Secret 3: AGENT_SUPABASE_KEY
```
Name: AGENT_SUPABASE_KEY
Secret: [Coller votre Supabase key depuis .env.agents.local]
```

## Étape 3 (Optionnel): Notifications Slack

### Secret 4: SLACK_WEBHOOK_URL (si vous avez Slack)
```
Name: SLACK_WEBHOOK_URL
Secret: [Votre webhook Slack]
```

---

## ✅ Vérification rapide

Une fois les secrets ajoutés, vous devriez voir:
- 🔒 AGENT_GITHUB_TOKEN
- 🔒 AGENT_VERCEL_TOKEN
- 🔒 AGENT_SUPABASE_KEY

---

## 🚀 Après ça, on teste le premier agent!

Temps estimé: **2 minutes**
