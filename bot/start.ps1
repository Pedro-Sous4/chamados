# Mata processos Chrome que estao usando a sessao do bot
Write-Host "[1/3] Encerrando processos Chrome do bot..."
Get-CimInstance Win32_Process | Where-Object {
    $_.Name -like "*chrom*" -and $_.CommandLine -like "*wpp-bot-session*"
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

# Remove arquivos de lock do Chrome
Write-Host "[2/3] Removendo lock files..."
$sessionDir = "$PSScriptRoot\tokens\wpp-bot-session"
Remove-Item -Force "$sessionDir\SingletonLock"   -ErrorAction SilentlyContinue
Remove-Item -Force "$sessionDir\SingletonCookie" -ErrorAction SilentlyContinue
Remove-Item -Force "$sessionDir\SingletonSocket" -ErrorAction SilentlyContinue

# Inicia o bot
Write-Host "[3/3] Iniciando o bot..."
Set-Location $PSScriptRoot
node src/index.js
