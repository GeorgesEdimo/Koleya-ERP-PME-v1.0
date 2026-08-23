@echo off
echo 🔧 Fix supertest + Node.js 22
echo.

cd /d "C:\Users\DadaSyst\Desktop\MES SAAS\SaaS-14-Facturation-PME"

echo Étape 1: Installer supertest...
call npm install --save-dev supertest

echo.
echo Étape 2: Commit et push...
git add package.json package-lock.json
git commit -m "fix: Add supertest for backend integration tests"
git push origin main

echo.
echo ✅ Supertest ajouté! Relancez le workflow.
echo.
pause
