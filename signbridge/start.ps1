# SignBridge Launcher
# Starts both FastAPI Backend and Vite React Frontend

$ProjectRoot = $PSScriptRoot
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SignBridge - Real-Time ISL Communication Platform" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# Check Python venv
$VenvPython = Join-Path $ProjectRoot "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "[!] Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv "$ProjectRoot\backend\.venv"
    & "$ProjectRoot\backend\.venv\Scripts\pip.exe" install -e "$ProjectRoot\backend"
}

# Start Backend
Write-Host "[*] Launching Backend on http://localhost:8000..." -ForegroundColor Green
$BackendJob = Start-Process -FilePath $VenvPython -ArgumentList "-m", "app.main" -WorkingDirectory "$ProjectRoot\backend" -PassThru

# Start Frontend
Write-Host "[*] Launching Frontend on http://localhost:5173..." -ForegroundColor Green
$FrontendJob = Start-Process -FilePath "pnpm" -ArgumentList "dev" -WorkingDirectory "$ProjectRoot\frontend" -PassThru

Write-Host "`nSignBridge is running!" -ForegroundColor Cyan
Write-Host "  * Frontend UI: http://localhost:5173" -ForegroundColor White
Write-Host "  * Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "  * API Docs:    http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nPress Ctrl+C or close the terminal to stop." -ForegroundColor Gray

try {
    # Keep running until user terminates
    Wait-Process -Id $BackendJob.Id, $FrontendJob.Id
} finally {
    Write-Host "`nStopping services..." -ForegroundColor Yellow
    Stop-Process -Id $BackendJob.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $FrontendJob.Id -ErrorAction SilentlyContinue
}

