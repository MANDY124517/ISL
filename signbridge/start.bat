@echo off
title SignBridge - Real-Time ISL Communication Platform
echo ============================================================
echo   SignBridge - Real-Time ISL Communication Platform
echo ============================================================

cd /d "%~dp0backend"
start "SignBridge Backend" .venv\Scripts\python.exe -m app.main

cd /d "%~dp0frontend"
start "SignBridge Frontend" pnpm dev

echo Services started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo Docs:     http://localhost:8000/docs
pause

