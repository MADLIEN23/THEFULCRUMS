# ToolTrack Local Development Launcher
# Starts backend API on :5000 and frontend interface on :5173

Write-Host "--- Launching ToolTrack Workshop System ---" -ForegroundColor Cyan

# Step 1: Initialize Database if needed
Write-Host "Verifying database status..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\backend"
npm run seed

# Step 2: Launch Backend in Background
Write-Host "Starting Backend API on http://localhost:5000..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$PSScriptRoot\backend" -PassThru

# Step 3: Launch Frontend
Write-Host "Starting Frontend Terminal on http://localhost:5173..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\frontend"
npm run dev
