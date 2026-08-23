@echo off
echo 🔧 Fix ESLint et push
echo.

cd /d "C:\Users\DadaSyst\Desktop\MES SAAS\SaaS-14-Facturation-PME"

echo Étape 1: Installer ESLint...
call npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks

echo.
echo Étape 2: Commit et push...
git add package.json package-lock.json .eslintrc.cjs .github/workflows/
git commit -m "fix: Add ESLint dependencies and config + Node.js 22"
git push origin main

echo.
echo ✅ ESLint ajouté! Relancez le workflow maintenant.
echo.
pause
