@echo off
:: Forçar o script a rodar como Administrador automaticamente
echo Solicitando privilegios de administrador...
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :rodar_servicos
) else (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:rodar_servicos
echo ==========================================
echo  INICIANDO TODOS OS SERVICOS DOS CHAMADOS
echo ==========================================

:: Define a pasta do PM2 global/sistema para evitar conflitos de permissão (EPERM)
set PM2_HOME=C:\ProgramData\pm2

echo [1/4] Limpando conexoes antigas do PM2...
cmd /c npx pm2 kill

echo [2/4] Iniciando Painel Web e WhatsApp Bot...
cd /d C:\Chamados\chamados
call npx pm2 start site/server.js --name chamados-site
call npx pm2 start bot/src/index.js --name chamados-bot

echo [3/4] Salvando estado atual do PM2 para inicializacao automatica...
call npx pm2 save

echo [4/4] Iniciando Tour System (React)...
cd /d C:\Chamados\chamados\tour-system
start "React Tour System" cmd /c npm start

echo.
echo ==========================================
echo  Todos os servicos foram disparados!
echo ==========================================
echo.
pause