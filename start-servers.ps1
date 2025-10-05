# HelpDesk Mini - Server Startup Script
# This script starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HelpDesk Mini - Starting Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes
Write-Host "Stopping any existing Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host ""
Write-Host "Starting Backend Server (Port 5000)..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server.js"

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Backend server is running!" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend server may not be ready yet. Check the backend terminal." -ForegroundColor Yellow
}

# Start Frontend Server
Write-Host ""
Write-Host "Starting Frontend Server (Port 3000)..." -ForegroundColor Green
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers Starting!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Two new terminal windows have been opened." -ForegroundColor Yellow
Write-Host "Wait a few moments for the servers to fully start." -ForegroundColor Yellow
Write-Host ""
Write-Host "Test Accounts:" -ForegroundColor Cyan
Write-Host "  Admin: admin@example.com / admin123" -ForegroundColor White
Write-Host "  Agent: agent@example.com / agent123" -ForegroundColor White
Write-Host "  User:  user@example.com / user123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

