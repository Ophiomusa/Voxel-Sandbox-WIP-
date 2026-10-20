@echo off
cd /d "%~dp0"
taskkill /F /IM node.exe > nul 2>&1
echo Serveur sur http://localhost:3000
start /B node server.js > nul 2>&1
timeout /t 2 /nobreak > nul
start http://localhost:3000
exit
