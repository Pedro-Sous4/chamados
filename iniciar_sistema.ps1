# Script de Inicialização dos Serviços (Site e Bot) via PM2
# Executar este script para garantir uma inicialização limpa dos serviços no servidor.

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  INICIANDO SISTEMA DE CHAMADOS (SITE + BOT)  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Definir Ambiente PM2
$env:PM2_HOME = "$PSScriptRoot\pm2_home"
$PM2_CMD = "C:\Users\SERVIDOR PEDRAS\AppData\Roaming\npm\pm2.cmd"

# Caso o executável do PM2 não esteja no caminho padrão do servidor, tenta o comando de fallback
if (-not (Test-Path $PM2_CMD)) {
    $PM2_CMD = "pm2"
}

# 2. Encerrar processos do nosso PM2 (caso existam) e limpar
Write-Host "`n[1/4] Limpando instâncias antigas do nosso PM2..." -ForegroundColor Yellow
& $PM2_CMD kill 2>$null

# 3. Remover arquivos de lock/sessão travada do Chrome
Write-Host "[2/4] Removendo lock files do WPPConnect..." -ForegroundColor Yellow
$sessionDirs = @(
    "$PSScriptRoot\bot\tokens\wpp-bot-session-v16",
    "$PSScriptRoot\tokens\wpp-bot-session-v16",
    "$PSScriptRoot\bot\tokens\wpp-bot-session",
    "$PSScriptRoot\tokens\wpp-bot-session"
)
foreach ($dir in $sessionDirs) {
    Remove-Item -Force "$dir\SingletonLock"   -ErrorAction SilentlyContinue
    Remove-Item -Force "$dir\SingletonCookie" -ErrorAction SilentlyContinue
    Remove-Item -Force "$dir\SingletonSocket" -ErrorAction SilentlyContinue
}

# 4. Iniciar ou Reiniciar os Serviços no PM2
Write-Host "[3/4] Inicializando os serviços no PM2..." -ForegroundColor Yellow

# Site/Frontend
Write-Host "-> Site/Frontend (chamados-site)..." -ForegroundColor Gray
& $PM2_CMD delete "chamados-site" 2>$null
& $PM2_CMD start "$PSScriptRoot\site\server.js" --name "chamados-site"

# Bot do WhatsApp
Write-Host "-> Bot do WhatsApp (chamados-bot)..." -ForegroundColor Gray
& $PM2_CMD delete "chamados-bot" 2>$null
& $PM2_CMD start "$PSScriptRoot\bot\src\index.js" --name "chamados-bot" --cwd "$PSScriptRoot\bot"

# 5. Salvar estado atual do PM2 para persistir no boot
Write-Host "[4/4] Salvando estado dos serviços no PM2..." -ForegroundColor Yellow
& $PM2_CMD save

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "  SISTEMA INICIADO COM SUCESSO NO PM2!       " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Para monitorar os serviços execute: pm2 status ou pm2 logs" -ForegroundColor Gray
Read-Host "`nPressione Enter para fechar..."
