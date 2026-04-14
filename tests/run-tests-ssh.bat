@echo off
REM ============================================================
REM Script de Execução SSH para Testes E2E do CRM
REM ============================================================
REM Uso: tests\run-tests-ssh.bat [modo]
REM   modo: local (padrão) | remote | supabase
REM ============================================================

set VPS_HOST=root@72.61.222.243
set SSH_KEY=C:\Users\diogo\.ssh\id_ed25519
set CRM_URL=https://crm.dvadvoga.com.br

echo.
echo ============================================================
echo  Nexus CRM v2 - Test Runner SSH
echo ============================================================
echo.

if "%1"=="remote" goto remote
if "%1"=="supabase" goto supabase

:local
echo [1/3] Executando testes E2E localmente...
echo.
cd nexus-crm-v2
call npx playwright test --project=crm-desktop --reporter=html
echo.
echo [2/3] Abrindo relatório...
start test-results\html-report\index.html
goto end

:remote
echo [1/3] Conectando via SSH à VPS...
echo.
ssh -i %SSH_KEY% %VPS_HOST% "cd /opt/dokploy/projects/nexus-crm-v2 && docker exec \$(docker ps -q --filter 'label=com.dokploy.application.name=nexus-crm-v2') npx playwright test --reporter=list"
echo.
echo [2/3] Testes remotos concluídos
goto end

:supabase
echo [1/2] Executando teste de conexão ao Supabase...
echo.
cd nexus-crm-v2
node tests/supabase-connection-test.mjs
goto end

:end
echo.
echo ============================================================
echo  Testes concluídos
echo ============================================================
echo.
pause
