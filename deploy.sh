#!/bin/bash
# Script de deploiement Koleya ERP
# Usage: bash deploy.sh

set -e

echo "=== Deploiement Koleya ERP ==="

# 1. Verifier les prerequis
echo ""
echo "1. Verification des prerequis..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installe"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installe"
    exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ Git $(git --version)"

# 2. Installer les dependances
echo ""
echo "2. Installation des dependances..."
npm install
cd backend && npm install && cd ..

# 3. Lancer les tests
echo ""
echo "3. Lancement des tests..."
npm test -- --run

# 4. Build
echo ""
echo "4. Build du frontend..."
npm run build

# 5. Verifier le build
if [ -d "dist" ]; then
    echo "✅ Build reussi — dossier dist/ genere"
else
    echo "❌ Le build a echoue"
    exit 1
fi

# 6. Git init
echo ""
echo "5. Initialisation Git..."
if [ ! -d ".git" ]; then
    git init
    git add .
    git commit -m "feat: Koleya ERP v2.0 — pret pour deploiement"
    echo "✅ Depot Git cree"
else
    echo "✅ Depot Git existant"
    git add .
    git status
fi

echo ""
echo "=== Etapes suivantes ==="
echo ""
echo "1. Creer un depôt GitHub: https://github.com/new"
echo "   Nom: koleya-erp"
echo ""
echo "2. Push sur GitHub:"
echo "   git remote add origin https://github.com/TON_UTILISATEUR/koleya-erp.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploier sur Vercel:"
echo "   https://vercel.com/new → Import Git Repository → koleya-erp"
echo ""
echo "4. Variables d'environnement Vercel:"
echo "   DATABASE_URL=postgresql://..."
echo "   JWT_SECRET=$(node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\")"
echo "   CORS_ORIGIN=https://koleya-erp.vercel.app"
echo ""
echo "=== Deploiement termine ! ==="
