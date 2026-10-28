@echo off
echo Starting Deutsch Lernen App...
echo.
echo [1/2] Starting Backend (port 5000)...
start "Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 3 /nobreak >nul
echo [2/2] Starting Frontend (port 3000)...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"
echo.
echo App is starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
