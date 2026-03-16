@echo off
cd /d "%~dp0"
setlocal enabledelayedexpansion

:menu
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                  DOCKER BUILD SELECTOR                           ║
echo ║                                                                  ║
echo ║  Select which services you want to build Docker images for.      ║
echo ║  Containers will NOT be started.                                 ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  [1] Build ALL Services (Full System)
echo  [2] Build Admin Service
echo  [3] Build File Service
echo  [4] Build SignalR Service
echo  [5] Build Gateway
echo  [6] Build Frontend (Next.js)
echo  [7] Build Backend Only (Admin + File + SignalR + Gateway)
echo.
echo  [0] EXIT
echo.
echo ──────────────────────────────────────────────────────────────────
echo.
set /p choice="Select option [0-7]: "

if "%choice%"=="1" goto :build_all
if "%choice%"=="2" goto :build_admin
if "%choice%"=="3" goto :build_file
if "%choice%"=="4" goto :build_signalr
if "%choice%"=="5" goto :build_gateway
if "%choice%"=="6" goto :build_frontend
if "%choice%"=="7" goto :build_backend
if "%choice%"=="0" exit /b 0
echo.
echo ERROR: Invalid option.
timeout /t 2 >nul
goto :menu

:build_all
cls
echo.
echo 🚀 Building ALL Docker images...
docker compose -f ../docker-compose.yml build
goto :end

:build_admin
cls
echo.
echo 🚀 Building Admin Service image...
docker compose -f ../docker-compose.yml build admin-service
goto :end

:build_file
cls
echo.
echo 🚀 Building File Service image...
docker compose -f ../docker-compose.yml build file-service
goto :end

:build_signalr
cls
echo.
echo 🚀 Building SignalR Service image...
docker compose -f ../docker-compose.yml build signalr
goto :end

:build_gateway
cls
echo.
echo 🚀 Building Gateway image...
docker compose -f ../docker-compose.yml build gateway
goto :end

:build_frontend
cls
echo.
echo 🚀 Building Frontend image...
docker compose -f ../docker-compose.yml build frontend
goto :end

:build_backend
cls
echo.
echo 🚀 Building ALL Backend images...
docker compose -f ../docker-compose.yml build admin-service file-service signalr gateway
goto :end

:end
echo.
if errorlevel 1 (
    echo ╔══════════════════════════════════════════════════════════════════╗
    echo ║                   ❌ BUILD FAILED                                ║
    echo ║              Check errors above for details                      ║
    echo ╚══════════════════════════════════════════════════════════════════╝
) else (
    echo ╔══════════════════════════════════════════════════════════════════╗
    echo ║                 ✅ BUILD COMPLETED SUCCESSFULLY                  ║
    echo ╚══════════════════════════════════════════════════════════════════╝
    echo.
    echo  To start services, run: docker compose -f ../docker-compose.yml up -d
)
echo.
pause
goto :menu
