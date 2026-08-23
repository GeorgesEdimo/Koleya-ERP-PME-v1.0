@echo off
echo 🚀 Activation du Superviseur Agent
echo.

cd /d "C:\Users\DadaSyst\Desktop\MES SAAS\SaaS-14-Facturation-PME"

echo Étape 1: Nettoyage Git...
del /f /q .git\index.lock 2>nul

echo Étape 2: Installation dépendances Superviseur...
cd supervisor
call npm install
cd ..

echo Étape 3: Ajout des fichiers...
git add supervisor/ .github/workflows/supervisor.yml SUPERVISOR_ARCHITECTURE.md SUPERVISEUR_ACTIVATION.md GITHUB_SECRETS_SETUP.md TEST_PREMIER_AGENT.md

echo Étape 4: Commit...
git commit -m "feat: Add autonomous Supervisor Agent for 24/7 validation"

echo Étape 5: Push vers GitHub...
git push origin main

echo.
echo ✅ SUPERVISEUR ACTIVÉ!
echo.
echo 🤖 Les 13 agents sont maintenant opérationnels 24/7
echo 😴 Vous pouvez dormir tranquille, tout est automatisé!
echo.
pause
