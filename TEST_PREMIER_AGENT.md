# 🚀 TEST DU PREMIER AGENT - GUIDE ÉCLAIR

## Méthode 1: Via GitHub Actions UI (Plus simple)

1. **Aller sur**: https://github.com/GeorgesEdimo/Koleya-ERP-PME-v1.0/actions

2. **Cliquer sur** "Koleya AI Agents Workflow" dans la liste à gauche

3. **Cliquer** sur le bouton "Run workflow" (à droite)

4. **Remplir le formulaire**:
   - **Use workflow from**: `main`
   - **Which agent to run?**: Choisir `qa-engineer`
   - **Task description**: `Test d'intégration GitHub Actions`
   - **Auto-merge PR if tests pass?**: Laisser décoché (false)

5. **Cliquer** "Run workflow" (vert)

6. **Attendre 30-60 secondes** → Rafraîchir la page

---

## Méthode 2: Via GitHub CLI (Si installé)

```bash
cd "C:\Users\DadaSyst\Desktop\MES SAAS\SaaS-14-Facturation-PME"

gh workflow run agents-workflow.yml \
  -f agent=qa-engineer \
  -f task="Test d'intégration GitHub Actions" \
  -f auto_merge=false
```

---

## 📊 Ce que l'agent va faire

1. ✅ Checkout du repo
2. ✅ Install dependencies
3. ✅ Run linter
4. ✅ Run tests
5. ✅ Build project
6. ✅ Créer une branche `agents/qa-engineer/TIMESTAMP`
7. ✅ Si changements → Commit + Push
8. ✅ Créer une PR automatiquement
9. ✅ Notifier (si Slack configuré)

---

## 🎯 Résultat attendu

Vous devriez voir:
- Une nouvelle branche créée
- Une Pull Request ouverte
- Labels: `agent-generated`, `needs-review`
- Titre: "🤖 Agent: qa-engineer - Test d'intégration GitHub Actions"

---

## 🆘 En cas d'erreur

**"Error: Invalid token"**
→ Vérifier que AGENT_GITHUB_TOKEN est correct dans Secrets

**"Permission denied"**
→ Le token n'a pas les permissions `repo` et `workflow`

**"Workflow not found"**
→ Le fichier `.github/workflows/agents-workflow.yml` n'est pas sur `main`

---

## ✅ Si ça marche

Les 12 agents sont maintenant **100% opérationnels** ! 🎉

Vous pourrez lancer:
- `/fullstack-dev` pour implémenter des features
- `/security-expert` pour les audits
- `/devops-engineer` pour les déploiements
- Et tous les autres...

---

**Temps estimé**: 2 minutes
**Date**: 22 août 2026 21:45 UTC
