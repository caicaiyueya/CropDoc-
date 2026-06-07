@echo off
chcp 65001 >nul
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-cloudcontainer.ps1"
if errorlevel 1 exit /b 1
pause
