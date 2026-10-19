# Script de Inicialização dos Serviços (Site e Bot) para Desenvolvimento (Sem PM2)
# Abre o site e o bot em janelas separadas do terminal.

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " INICIANDO SISTEMA EM DESENVOLVIMENTO (LOCAL) " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Encerrar processos Chrome do Bot para evitar travar a sessão do WPPConnect
Write-Host "`n[1/3] Encerrando processos Chrome do bot..." -ForegroundColor Yellow
Get-CimInstance Win32_Process | Where-Object {
    $_.Name -like "*chrom*" -and $_.CommandLine -like "*wpp-bot-session*"
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

# 2. Remover arquivos de lock/sessão travada do Chrome
Write-Host "[2/3] Removendo lock files do WPPConnect..." -ForegroundColor Yellow
$sessionDir = "$PSScriptRoot\bot\tokens\wpp-bot-session"
Remove-Item -Force "$sessionDir\SingletonLock"   -ErrorAction SilentlyContinue
Remove-Item -Force "$sessionDir\SingletonCookie" -ErrorAction SilentlyContinue
Remove-Item -Force "$sessionDir\SingletonSocket" -ErrorAction SilentlyContinue

# 3. Iniciar os Serviços em novas janelas do terminal
Write-Host "[3/3] Abrindo Site e Bot em novas janelas..." -ForegroundColor Yellow

# Iniciar o Site/Frontend (npm run dev)
Write-Host "-> Abrindo console do Site..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- INICIANDO SITE (FRONTEND) ---' -ForegroundColor Green; cd '$PSScriptRoot\site'; npm run dev"

# Iniciar o Bot do WhatsApp (Executa o script de inicialização local ou npm run dev)
Write-Host "-> Abrindo console do Bot..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '--- INICIANDO BOT ---' -ForegroundColor Green; cd '$PSScriptRoot\bot'; npm run dev"

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "  JANELAS INICIADAS COM SUCESSO!            " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Você pode fechar esta janela agora. O Site e o Bot continuam rodando nas outras janelas." -ForegroundColor Gray
sleep 3
