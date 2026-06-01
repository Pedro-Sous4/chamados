@echo off
:: Atalho para rodar o script de desenvolvimento
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File .\iniciar_sistema_desenvolvimento.ps1
