# 🚀 Guide de Configuration des Agents AI Koleya

Ce guide vous explique comment configurer les agents pour qu'ils aient accès à vos services.

## ⚡ Configuration Rapide (5 minutes)

### Étape 1 : Créer votre fichier de secrets local

```bash
# Copier le template
cp .env.agents.example .env.agents.local

# Éditer avec vos vraies valeurs
# Utilisez un éditeur de texte sécurisé (pas de cloud sync!)
```

### Étape 2 : Configurer les GitHub Secrets

Aller sur : `https://github.com/YOUR_USERNAME/Koleya-ERP-PME-v1.0/settings/secrets/actions`

Créer ces secrets :

1. **AGENT_GITHUB_TOKEN**
   - Valeur : Votre GitHub Personal Access Token
   - Permissions : repo, workflow, write:packages

2. **AGENT_VERCEL_TOKEN**
   - Valeur : Votre Vercel API Token
   - Obtenir ici : https://vercel.com/account/tokens

3. **AGENT_SUPABASE_KEY**
   - Valeur : Votre Supabase Service Role Key
   - Obtenir ici : https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api

4. **SLACK_WEBHOOK_URL** (Optionnel)
   - Valeur : URL de webhook Slack
   - Créer ici : https://api.slack.com/apps

### Étape 3 : Tester l'intégration

```bash
# Lancer un test simple
npm run agent:test

# Ou via GitHub Actions
gh workflow run agents-workflow.yml \
  -f agent=qa-engineer \
  -f task="Test de l'intégration"
```

## 📋 Checklist de sécurité

- [ ] `.env.agents.local` créé et rempli
- [ ] `.env.agents.local` n'est PAS dans Git (vérifié avec `git status`)
- [ ] GitHub Secrets configurés
- [ ] Tokens révoqués si compromis
- [ ] Backup des tokens dans un password manager

## 🔐 Sécurité

### ⚠️ NE JAMAIS :
- ❌ Committer `.env.agents.local` sur Git
- ❌ Partager vos tokens dans un chat/email
- ❌ Utiliser les mêmes tokens pour dev et prod
- ❌ Donner des permissions plus larges que nécessaire

### ✅ TOUJOURS :
- ✅ Utiliser GitHub Secrets pour CI/CD
- ✅ Rotation des tokens tous les 90 jours
- ✅ Garder un backup sécurisé (1Password, etc.)
- ✅ Révoquer immédiatement si compromis
- ✅ Utiliser des tokens avec le minimum de permissions

## 🤖 Utilisation des Agents

### Via Claude Chat (cette interface)
```
/fullstack-dev implémenter le module devis
/qa-engineer tester le module facturation
/security-expert audit de sécurité complet
```

### Via GitHub Actions UI
1. Aller sur Actions → Koleya AI Agents Workflow
2. Click "Run workflow"
3. Choisir l'agent
4. Entrer la tâche
5. Run!

### Via GitHub CLI
```bash
gh workflow run agents-workflow.yml \
  -f agent=fullstack-dev \
  -f task="Ajouter le module fournisseurs"
```

## 📊 Permissions par Agent

| Agent | GitHub | Vercel | Database | Notes |
|-------|--------|--------|----------|-------|
| architect | Read | Read | Read | Review only |
| fullstack-dev | Write | Read | Write | Branches only |
| qa-engineer | Read | Read | Read | Comments on PRs |
| security-expert | Read | Read | Read | Audits only |
| devops-engineer | Write | Write | Read | Deployments |
| sre | Read | Read | Read | Monitoring |

## 🆘 Troubleshooting

### Erreur: "Permission denied"
→ Vérifier que le token a les bonnes permissions

### Erreur: "Invalid token"
→ Le token a expiré ou a été révoqué. Créer un nouveau.

### Erreur: "Rate limit exceeded"
→ Trop de requêtes. Attendre quelques minutes.

### Les agents ne créent pas de PR
→ Vérifier `AGENT_GITHUB_TOKEN` dans GitHub Secrets

## 📞 Support

- Documentation complète : `AI_TEAM_INTEGRATIONS.md`
- Guide d'automation : `AGENTS_AUTOMATION_SETUP.md`
- Architecture : `AI_TEAM_ARCHITECTURE.md`

---

**Version** : 1.0  
**Dernière mise à jour** : 22 août 2026
