# Este script deve ser executado como ADMINISTRADOR para configurar a inicialização automática.
# Ele cria uma Tarefa Agendada que roda no boot do Windows (antes mesmo de qualquer usuário logar).

$TaskName = "ChamadosServicesStartup"
$ScriptPath = "c:\Chamados\chamados\startup.ps1"
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force

Write-Host "Configuração concluída! O site e o bot agora iniciarão automaticamente com o Windows." -ForegroundColor Green
