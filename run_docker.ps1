Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  MOTION-AI / GearGuard Docker Setup & Runner" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Verify Docker CLI
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    Exit 1
}

# Check if Docker daemon is running
$dockerRunning = $false
try {
    $null = docker ps 2>$null
    if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "[INFO] Docker Desktop daemon is not running yet." -ForegroundColor Yellow
    Write-Host "[INFO] Attempting to launch Docker Desktop..." -ForegroundColor Yellow
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
    } else {
        Write-Host "[WARNING] Please open Docker Desktop from your Windows Start menu." -ForegroundColor Yellow
    }

    Write-Host "[INFO] Waiting for Docker engine to initialize..." -ForegroundColor Yellow
    while (-not $dockerRunning) {
        Start-Sleep -Seconds 4
        $null = docker ps 2>$null
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
        } else {
            Write-Host "  ... waiting for Docker daemon ..." -ForegroundColor Gray
        }
    }
    Write-Host "[SUCCESS] Docker daemon is ready!" -ForegroundColor Green
}

Write-Host "`n[INFO] Starting containers via Docker Compose (Backend, Frontend, MongoDB)...`n" -ForegroundColor Cyan
docker compose up --build
