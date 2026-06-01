@echo off
:: Atalho em lote para executar o script do PowerShell com privilégios de bypass
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File .\iniciar_sistema.ps1
