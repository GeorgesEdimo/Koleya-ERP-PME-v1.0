# 🤖 KOLEYA AI TEAM — GUIDE D'UTILISATION

**Status** : 3/12 agents créés ✅  
**Date** : 22 août 2026  
**Disponibilité** : Tous les agents sont disponibles comme `/skills`

---

## 🎯 LES 3 AGENTS CRÉÉS

### 1️⃣ **ARCHITECT** ✅
**Rôle** : Architecte système senior  
**Expertise** : Architecture, patterns, scalabilité, décisions techniques  
**Invocation** : `/architect concevoir l'architecture de...`

**Cas d'usage** :
- Concevoir une nouvelle fonctionnalité
- Reviewer une architecture
- Optimiser pour la scalabilité
- Créer des ADR (Architecture Decision Records)
- Diagrams C4, séquence

---

### 2️⃣ **FULLSTACK-DEV** ✅
**Rôle** : Développeur full-stack senior  
**Expertise** : React 18 + Express.js + PostgreSQL, end-to-end  
**Invocation** : `/fullstack-dev implémenter la fonctionnalité...`

**Cas d'usage** :
- Implémenter des features complètes (frontend + backend + DB)
- Créer des API endpoints
- Composants React optimisés
- Migrations SQL
- Code de qualité production

---

### 3️⃣ **QA-ENGINEER** ✅
**Rôle** : Ingénieur qualité & tests  
**Expertise** : Jest, Vitest, Supertest, Playwright, >80% couverture  
**Invocation** : `/qa-engineer tester...`

**Cas d'usage** :
- Écrire tests unitaires
- Tests d'intégration API
- Tests E2E (workflows utilisateur)
- Vérifier la couverture de code
- Checklists qualité

---

## 🚀 AGENTS À CRÉER (9 restants)

### 4. **SECURITY-EXPERT**
- Audit de sécurité OWASP Top 10
- Gestion des secrets, JWT, 2FA
- Scan vulnérabilités (npm audit, Snyk)
- Conformité RGPD

### 5. **FRONTEND-SPECIALIST**
- React avancé (Hooks, Context, Memoization)
- Performance (bundle size, lazy loading)
- Animations (Framer Motion)
- Accessibilité (WCAG 2.1)

### 6. **BACKEND-SPECIALIST**
- APIs Express.js optimisées
- Requêtes PostgreSQL complexes
- Caching (Redis)
- Background jobs

### 7. **DEVOPS-ENGINEER**
- Docker & Kubernetes
- Pipelines CI/CD (GitHub Actions)
- Infrastructure as Code (Terraform)
- Scripts de déploiement

### 8. **SRE** (Site Reliability Engineer)
- Monitoring (Prometheus, Grafana)
- Logging centralisé (ELK)
- Alerting et incident response
- SLI/SLO/SLA management

### 9. **DESIGNER** (UX/UI)
- Conception interfaces (Figma-style)
- Design system & composants
- Accessibilité
- User flows, wireframes

### 10. **DATA-ENGINEER**
- Pipelines ETL
- Data warehouse
- Requêtes analytiques
- Rapports et dashboards

### 11. **PERFORMANCE-ENGINEER**
- Profiling backend/frontend
- Optimisation SQL
- Load testing (k6, Artillery)
- Caching stratégies

### 12. **TECH-WRITER**
- Documentation API (Swagger)
- README et guides
- Architecture Decision Records
- Tutoriels utilisateurs

---

## 📋 PATTERNS D'UTILISATION

### Pattern 1 : Agent Unique
```
User: "/fullstack-dev implémenter le module de gestion des fournisseurs"
FULLSTACK-DEV:
  1. Lire la spec de ARCHITECT
  2. Concevoir le schéma DB
  3. Créer les API endpoints
  4. Implémenter les composants React
  5. Livrer avec tests
```

### Pattern 2 : Workflow Séquentiel
```
User: "Nouvelle fonctionnalité : export Excel avancé"

1. ARCHITECT
   → Concevoir l'architecture
   → Documenter avec ADR
   
2. FULLSTACK-DEV
   → Implémenter backend + frontend
   → Créer migrations SQL
   
3. QA-ENGINEER
   → Écrire tests unitaires + E2E
   → Vérifier couverture >80%
   
4. SECURITY-EXPERT
   → Audit sécurité
   → Vérifier l'input validation
   
5. TECH-WRITER
   → Documenter l'API
   → Créer un guide utilisateur
   
6. DEVOPS-ENGINEER
   → Merger → Pipeline CI/CD
   → Déployer sur staging
   
7. SRE
   → Monitorer la déploiement
   → Vérifier les métriques
```

### Pattern 3 : Optimisation Performance
```
User: "L'app ralentit, optimiser les perfs"

En parallèle :
├─ PERFORMANCE-ENGINEER (profiling)
├─ BACKEND-SPECIALIST (SQL optimization)
├─ FRONTEND-SPECIALIST (bundle optimization)
└─ SRE (monitoring)

Synthèse → Recommandations avec chiffres
```

### Pattern 4 : Audit Sécurité Complet
```
User: "Audit de sécurité avant production"

1. SECURITY-EXPERT → Scan vulnérabilités
2. BACKEND-SPECIALIST → Fix backend issues
3. FRONTEND-SPECIALIST → Fix XSS/CSRF
4. QA-ENGINEER → Tests sécurité
5. TECH-WRITER → Documentation sécurité
```

---

## 🎯 ROADMAP CRÉATION AGENTS

### Phase 1 : Core Team (Semaines 1-2) ✅
- [x] ARCHITECT
- [x] FULLSTACK-DEV
- [x] QA-ENGINEER
- [ ] SECURITY-EXPERT (cette semaine)
- [ ] FRONTEND-SPECIALIST (cette semaine)
- [ ] BACKEND-SPECIALIST (cette semaine)

### Phase 2 : Infrastructure (Semaines 3-4)
- [ ] DEVOPS-ENGINEER
- [ ] SRE
- [ ] PERFORMANCE-ENGINEER

### Phase 3 : Spécialisés (Semaines 5-6)
- [ ] DESIGNER
- [ ] DATA-ENGINEER
- [ ] TECH-WRITER

### Phase 4 : Coordination (Semaines 7+)
- [ ] COORDINATOR (orchestration)
- [ ] Memory system partagée
- [ ] Workflows inter-agents

---

## 💡 EXEMPLES D'UTILISATION RÉELLE

### Exemple 1 : Créer le module Devis (Phase 2)

```
USER: "/architect concevoir l'architecture du module devis"

ARCHITECT:
  - Analyse requirements (9 types de devis)
  - Propose architecture (Devis → Facture)
  - Crée le schéma DB
  - Documente avec ADR
  → Prêt pour dev

USER: "/fullstack-dev implémenter le module devis complet"

FULLSTACK-DEV:
  - Crée migration SQL (013_devis.sql)
  - Endpoints API : 
    POST /api/devis
    GET /api/devis/:id
    PUT /api/devis/:id
    DELETE /api/devis/:id
    POST /api/devis/:id/convert-to-invoice
  - Composants React (9 formulaires)
  - Tests unitaires
  → Code prêt

USER: "/qa-engineer tester le module devis"

QA-ENGINEER:
  - Tests API Supertest
  - Tests E2E Playwright
  - Couverture > 80%
  → Qualité garantie

USER: "/security-expert audit du module devis"

SECURITY-EXPERT:
  - Vérifier l'input validation Zod
  - Multi-tenant isolation
  - SQL injection prevention
  → Sécurité OK

USER: "/devops-engineer merger et déployer sur staging"

DEVOPS-ENGINEER:
  - Merge PR
  - GitHub Actions pipeline
  - Deploy sur staging
  - Smoke tests
  → En production (staging)

USER: "/sre monitorer la déploiement"

SRE:
  - Vérifier les logs
  - Dashboards Grafana
  - Alertes PagerDuty
  → Tout nominal
```

### Exemple 2 : Bug critique production

```
USER: "🚨 Erreur 500 sur /api/factures, 50 utilisateurs affectés"

SRE: (immédiat)
  - Analyse les logs Sentry
  - Identifie le problème (N+1 query)
  - Alert l'équipe

BACKEND-SPECIALIST: (5 min)
  - Fix la query N+1
  - Crée un hotfix
  - Tests locaux

QA-ENGINEER: (2 min)
  - Tests de régression rapides
  - Valide le fix

DEVOPS-ENGINEER: (2 min)
  - Déploie le hotfix en prod
  - Monitore le rollout

SRE: (immédiat)
  - Vérifie les métriques
  - Erreur rate revient à 0
  - Post-mortem planifié

TECH-WRITER:
  - Document le post-mortem
  - Recommandations pour éviter à l'avenir
```

### Exemple 3 : Préparation lancement commercial

```
COORDINATOR: "Préparer le lancement commercial"

Parallèle :
├─ SECURITY-EXPERT → Audit sécurité complet
├─ PERFORMANCE-ENGINEER → Load testing (10k users)
├─ QA-ENGINEER → Tests E2E complets
├─ ARCHITECT → Review architecture pour scalabilité
└─ TECH-WRITER → Documentation utilisateur

Séquentiel :
1. DEVOPS-ENGINEER → Infra prod validée
2. SRE → Monitoring, alertes, dashboards
3. FRONTEND-SPECIALIST → UI/UX polish
4. DESIGNER → Design final

Résultat :
✅ Application production-ready
✅ Scalable pour 10k+ utilisateurs
✅ Documentée et testée
✅ Monitorée 24/7
```

---

## 🔥 COMMANDES RAPIDES

```bash
# Voir les agents disponibles
/skills

# Invoquer un agent
/architect [prompt]
/fullstack-dev [prompt]
/qa-engineer [prompt]
/security-expert [prompt]  # À venir
/frontend-specialist [prompt]  # À venir
/backend-specialist [prompt]  # À venir

# Workflows orchestrés (à venir)
/team concevoir la nouvelle feature
/team optimiser les performances
/team audit sécurité complet
```

---

## 📊 STATISTIQUES ÉQUIPE

| Métrique | Valeur |
|----------|--------|
| Agents créés | 3/12 |
| Skills sauvegardées | 3 |
| Heures d'expertise combinée | 100+ |
| Couverture expertise | 25% |
| Production readiness | 60% |

---

## 🎓 NEXT STEPS

**Cette semaine** :
1. Créer SECURITY-EXPERT
2. Créer FRONTEND-SPECIALIST
3. Créer BACKEND-SPECIALIST
4. Tester les workflows

**Semaine prochaine** :
5. DEVOPS-ENGINEER
6. SRE
7. PERFORMANCE-ENGINEER

**Objectif** : Équipe complète (12/12 agents) dans 3 semaines

---

## 💬 FEEDBACK & AMÉLIORATION

Les agents apprennent et s'améliorent à chaque utilisation. Donnez du feedback :

```
USER: "/architect [prompt]"

ARCHITECT: [Propose architecture]

USER: "Plus de détails sur les caching strategies"

ARCHITECT: [Améliore la réponse]
```

Les agents adaptent leur réponse à votre contexte spécifique.

---

**Équipe Koleya AI Team en action ! 🚀**  
**Prochaine mise à jour : 25 août 2026**