@echo off
echo ========================================================
echo   MOTION-AI / GearGuard Docker Runner
echo ========================================================
echo.

:: Check if docker CLI is available
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

:: Check if Docker daemon is running
docker ps >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Docker Desktop daemon is not running yet.
    echo [INFO] Attempting to launch Docker Desktop...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo [WARNING] Could not find Docker Desktop in default path. Please open Docker Desktop manually.
    )

    echo [INFO] Waiting for Docker engine to initialize (this may take 20-40 seconds)...
    :WAIT_LOOP
    timeout /t 5 /nobreak >nul
    docker ps >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo   ... waiting for Docker daemon ...
        goto WAIT_LOOP
    )
    echo [SUCCESS] Docker daemon is ready!
)

echo.
echo [INFO] Starting containers via Docker Compose (Backend, Frontend, MongoDB)...
echo.
docker compose up --build

echo.
echo ========================================================
echo   To stop all containers: docker compose down
echo ========================================================
pause
