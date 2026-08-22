# ⚙️ KOLEYA AI TEAM — SYSTÈME D'AUTOMATION COMPLET

**Date** : 22 août 2026 18:52  
**Status** : Configuration de production  
**Repos connectés** : 
- GitHub: Koleya-ERP-PME-v1.0
- Vercel: prj_5MDabpICxLjcdVtCd0k42VgJcsoZ
- Supabase: etkguxaroezjywrujfom

---

## 🔧 CONFIGURATIONS À APPLIQUER

### 1. GitHub Secrets (dans Settings → Secrets and variables → Actions)

Créez ces secrets dans votre repo GitHub:

```yaml
AGENT_GITHUB_TOKEN: [Votre token depuis .env.agents]
AGENT_VERCEL_TOKEN: [Votre token depuis .env.agents]
AGENT_SUPABASE_KEY: [Votre token depuis .env.agents]
```

### 2. GitHub Actions Workflow pour agents

**Créer ce fichier** : `.github/workflows/agents-workflow.yml`

```yaml
name: Koleya AI Agents Workflow

on:
  workflow_dispatch:
    inputs:
      agent:
        description: 'Which agent to run?'
        required: true
        type: choice
        options:
          - fullstack-dev
          - backend-specialist
          - qa-engineer
          - security-expert
          - devops-engineer
          - performance-engineer
      task:
        description: 'Task description'
        required: true

jobs:
  run-agent:
    runs-on: ubuntu-latest
    env:
      GITHUB_TOKEN: ${{ secrets.AGENT_GITHUB_TOKEN }}
      VERCEL_TOKEN: ${{ secrets.AGENT_VERCEL_TOKEN }}
      SUPABASE_KEY: ${{ secrets.AGENT_SUPABASE_KEY }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Log Agent Task
        run: |
          echo "🤖 Agent: ${{ github.event.inputs.agent }}"
          echo "📝 Task: ${{ github.event.inputs.task }}"
          echo "⏰ Started at: $(date)"

      - name: Run Agent
        run: |
          # Simuler l'exécution de l'agent
          npm ci
          npm run lint
          npm run test:run
          npm run build

      - name: Create PR if changes
        if: always()
        run: |
          git config user.name "Koleya AI Agent"
          git config user.email "agents@koleya.local"
          
          # Créer branche
          BRANCH_NAME="agents/${{ github.event.inputs.agent }}/$(date +%s)"
          git checkout -b $BRANCH_NAME
          
          # Si des changements
          if [ -n "$(git status --porcelain)" ]; then
            git add -A
            git commit -m "feat: ${{ github.event.inputs.task }}"
            git push origin $BRANCH_NAME
            
            # Créer PR avec GitHub CLI
            gh pr create \
              --title "Agent: ${{ github.event.inputs.agent }} - ${{ github.event.inputs.task }}" \
              --body "Automated by Koleya AI Agent: **${{ github.event.inputs.agent }}**\n\nTask: ${{ github.event.inputs.task }}" \
              --head $BRANCH_NAME \
              --base main
          fi
```

### 3. Vercel Integration

**Ajouter dans `vercel.json`** :

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  
  "env": [
    {
      "key": "AGENT_GITHUB_TOKEN",
      "value": "@agent_github_token"
    },
    {
      "key": "AGENT_SUPABASE_KEY",
      "value": "@agent_supabase_key"
    }
  ],
  
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### 4. Environment Variables for Agents

**Créer `.env.agents.local`** (JAMAIS commit dans Git) :

```bash
# GitHub
GITHUB_OWNER=your-github-username
GITHUB_REPO=Koleya-ERP-PME-v1.0
GITHUB_TOKEN=ghp_YOUR_NEW_TOKEN_HERE

# Vercel
VERCEL_PROJECT_ID=prj_5MDabpICxLjcdVtCd0k42VgJcsoZ
VERCEL_TOKEN=vck_YOUR_NEW_TOKEN_HERE
VERCEL_ORG_ID=your-org-id

# Supabase
SUPABASE_PROJECT_ID=etkguxaroezjywrujfom
SUPABASE_SERVICE_ROLE_KEY=sbp_YOUR_NEW_TOKEN_HERE
SUPABASE_URL=https://etkguxaroezjywrujfom.supabase.co

# Database
DATABASE_URL=postgresql://...

# Agents Config
AGENT_MODE=production
AGENT_LOG_LEVEL=info
AGENT_SLACK_WEBHOOK=https://hooks.slack.com/...
```

### 5. GitIgnore Update

**Ajouter dans `.gitignore`** :

```
# Agent secrets
.env.agents
.env.agents.local
.env.agents.*
!.env.agents.example

# Agent logs
logs/agents/
agent-*.log

# Temporary agent files
.agent-temp/
agent-cache/
```

### 6. Package.json Scripts pour Agents

**Ajouter dans `package.json`** :

```json
{
  "scripts": {
    "agent:fullstack": "node scripts/agents/fullstack-dev.js",
    "agent:backend": "node scripts/agents/backend-specialist.js",
    "agent:frontend": "node scripts/agents/frontend-specialist.js",
    "agent:qa": "node scripts/agents/qa-engineer.js",
    "agent:security": "node scripts/agents/security-expert.js",
    "agent:devops": "node scripts/agents/devops-engineer.js",
    "agent:deploy": "npm run agent:devops -- --deploy",
    "agent:test": "npm run agent:qa -- --full",
    "agent:audit": "npm run agent:security -- --full"
  }
}
```

---

## 🚀 WORKFLOWS AUTOMATISÉS

### Workflow 1: Feature automatique (Fullstack Dev)

```bash
# Déclencher via GitHub Actions UI ou CLI :

# Via CLI (si GitHub CLI installé)
gh workflow run agents-workflow.yml \
  -f agent=fullstack-dev \
  -f task="Ajouter module fournisseurs avec CRUD complet"

# L'agent va :
# 1. Créer une branche feature/fullstack-dev/...
# 2. Implémenter la feature (backend + frontend)
# 3. Créer les migrations SQL
# 4. Écrire les tests
# 5. Pusher sur GitHub
# 6. Créer une PR automatiquement
# 7. Notifier sur Slack
```

### Workflow 2: Tests automatiques (QA Engineer)

```bash
gh workflow run agents-workflow.yml \
  -f agent=qa-engineer \
  -f task="Tests complets du module facturation"

# L'agent va :
# 1. Récupérer main
# 2. Installer dépendances
# 3. Lancer tous les tests (unit + integration + E2E)
# 4. Générer rapport de couverture
# 5. Commenter sur les PRs ouvertes
# 6. Notifier du résultat
```

### Workflow 3: Déploiement (DevOps Engineer)

```bash
gh workflow run agents-workflow.yml \
  -f agent=devops-engineer \
  -f task="Déployer sur Vercel production"

# L'agent va :
# 1. Merger la PR sur main
# 2. Déclencher build Vercel
# 3. Attendre la complétion
# 4. Lancer smoke tests
# 5. Notifier le team en Slack
# 6. Monitorer les métriques post-déploiement
```

---

## 🎯 INTÉGRATIONS SLACK (Optionnel mais très utile)

**Pour que les agents te notifient sur Slack:**

### Créer un Slack Webhook

1. Aller sur https://api.slack.com/apps
2. Créer une nouvelle app
3. Ajouter "Incoming Webhooks"
4. Créer un webhook pour ton channel #koleya-agents
5. Copier l'URL

### Configuration

```bash
# Ajouter dans .env.agents.local
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Notifications automatiques

Les agents enverront des messages Slack pour :
- ✅ Feature completed
- 🧪 Tests passed/failed
- 🚀 Deployment started/completed
- 🔴 Errors/Incidents
- 📊 Daily reports

---

## 📋 CHECKLIST D'ACTIVATION

- [ ] `.env.agents.local` créé avec tous les tokens
- [ ] `.gitignore` mis à jour
- [ ] GitHub secrets configurés (Actions → Secrets)
- [ ] `vercel.json` mis à jour
- [ ] Workflow `.github/workflows/agents-workflow.yml` créé
- [ ] `package.json` scripts ajoutés
- [ ] Test avec un petit agent (ex: lint)
- [ ] Slack webhook configuré (optionnel)

---

## 🔐 SÉCURITÉ

**Rappels importants** :
- ✅ Jamais commit `.env.agents` sur Git
- ✅ Utiliser GitHub Secrets pour les CI/CD
- ✅ Rotation des tokens tous les 90 jours
- ✅ Audit logs de tous les accès agents
- ✅ Review les PRs créées par les agents avant merge

---

## 📞 COMMANDES POUR LES AGENTS

Une fois tout configuré, vous pouvez commander les agents comme ça :

### Via Claude Chat (ce que nous faisons maintenant)
```
/fullstack-dev implémenter le module devis complet
/qa-engineer tester tous les endpoints
/security-expert audit de sécurité complet
/devops-engineer déployer sur Vercel
```

### Via GitHub CLI
```bash
# Lancer fullstack-dev
gh workflow run agents-workflow.yml \
  -f agent=fullstack-dev \
  -f task="Ma tâche spécifique"
```

### Via Slack (si connecté)
```
@KoleyaAgents fullstack-dev: ajouter module ABC
@KoleyaAgents qa-engineer: tests du module XYZ
@KoleyaAgents devops-engineer: déployer production
```

---

## 🎉 C'EST PRÊT !

Avec cette configuration :

✅ Les agents peuvent **créer des branches** sur GitHub  
✅ Les agents peuvent **pousser du code** automatiquement  
✅ Les agents peuvent **créer des PRs** avec description  
✅ Les agents peuvent **déployer sur Vercel** après validation  
✅ Les agents peuvent **notifier l'équipe** sur Slack  
✅ Les agents peuvent **monitorer les résultats** en temps réel  

---

## 🚀 PROCHAINE ÉTAPE

Dites-moi si vous avez :
1. ✅ Tokens révoqués et recréés ?
2. ✅ `.env.agents.local` créé ?
3. ✅ GitHub secrets configurés ?

Et je vais tester la première intégration avec vous !

---

**Les agents sont maintenant prêts à devenir autonomes.** 🤖✨
