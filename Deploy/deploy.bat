@echo off
cd /d "%~dp0"
REM ╔══════════════════════════════════════════════════════════════════╗
REM ║          DOCKER DEPLOYMENT MANAGER - SELECT OPTION              ║
REM ║                PostgreSQL: Host/123456                           ║
REM ║         Container Reuse: --no-recreate enabled                  ║
REM ╚══════════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion

:menu
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                                                                  ║
echo ║               DOCKER DEPLOYMENT OPTIONS                         ║
echo ║                                                                  ║
echo ║         PostgreSQL: Host / 123456 (FIXED)                       ║
echo ║         Container Reuse: Enabled (no data loss)                 ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  [1] DEPLOY COMPLETE
echo      └─ Deploys ALL 5 services (PostgreSQL, Admin, Gateway, SignalR, Frontend)
echo      └─ Recommended for full production deployment
echo      └─ Includes Next.js frontend (http://localhost:3001)
echo.
echo  [2] DEPLOY BACKEND ONLY
echo      └─ Deploys 4 backend services (PostgreSQL, Admin, Gateway, SignalR)
echo      └─ Skips frontend (useful for backend-only debugging)
echo      └─ Can add frontend later with option [1]
echo.
echo  [3] BUILD IMAGES ONLY
echo      └─ Only builds Docker images (does NOT start containers)
echo      └─ Useful for CI/CD pipelines or pre-building images
echo      └─ Run 'docker compose up -d' manually after
echo.
echo  [4] STOP SERVICES
echo      └─ Stops all running services
echo      └─ Keeps containers and volumes (data preserved)
echo      └─ Can restart later with option [1] or [2]
echo.
echo  [5] STOP & REMOVE CONTAINERS
echo      └─ Stops and removes all containers
echo      └─ Keeps volumes and data
echo      └─ Clean restart needed with option [1] or [2]
echo.
echo  [6] FULL CLEANUP (⚠️ DATA LOSS!)
echo      └─ Stops containers, removes containers AND volumes
echo      └─ ⚠️ WARNING: PostgreSQL data will be DELETED
echo      └─ Only use if you want complete reset
echo.
echo  [7] VIEW STATUS
echo      └─ Shows status of all running containers
echo      └─ Shows ports and health checks
echo.
echo  [8] VIEW LOGS
echo      └─ Shows real-time logs from all services
echo      └─ Press Ctrl+C to stop viewing logs
echo.
echo  [0] EXIT
echo.
echo ──────────────────────────────────────────────────────────────────
echo.
set /p choice="Select option [0-8]: "

if "%choice%"=="1" goto :deploy_complete
if "%choice%"=="2" goto :deploy_backend
if "%choice%"=="3" goto :build_only
if "%choice%"=="4" goto :stop_services
if "%choice%"=="5" goto :stop_remove
if "%choice%"=="6" goto :full_cleanup
if "%choice%"=="7" goto :view_status
if "%choice%"=="8" goto :view_logs
if "%choice%"=="0" goto :exit
echo.
echo ERROR: Invalid option. Please select 0-8.
timeout /t 2 /nobreak
goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:deploy_complete
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    DEPLOYING ALL SERVICES                        ║
echo ║                                                                  ║
echo ║  PostgreSQL + Admin API + Gateway + SignalR + Frontend          ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo [1/4] Building images...
docker compose -f ../docker-compose.yml build
if errorlevel 1 goto :error

echo.
echo [2/4] Stopping services...
docker compose -f ../docker-compose.yml stop

echo.
echo [3/4] Starting services (keeping existing containers)...
docker compose -f ../docker-compose.yml up --no-recreate -d
if errorlevel 1 goto :error

echo.
echo [4/4] Verifying services...
timeout /t 3 /nobreak
docker compose -f ../docker-compose.yml ps

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                  ✅ DEPLOYMENT COMPLETED                         ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  Services URLs:
echo    • Frontend:   http://localhost:3001
echo    • Admin API:  http://localhost:7028
echo    • Gateway:    http://localhost:5002
echo    • SignalR:    http://localhost:5003
echo    • Database:   localhost:5433 ^(postgres / 123456 / Host^)
echo.
echo  View logs:  docker compose -f ../docker-compose.yml logs -f
echo.
pause
goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:deploy_backend
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                  DEPLOYING BACKEND ONLY                          ║
echo ║                                                                  ║
echo ║      PostgreSQL + Admin API + Gateway + SignalR                 ║
echo ║      ^(Frontend skipped - useful for debugging^)                  ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo [1/4] Building backend images...
docker compose -f ../docker-compose.yml build postgres admin-service gateway signalr file-service
if errorlevel 1 goto :error

echo.
echo [2/4] Stopping services...
docker compose -f ../docker-compose.yml stop

echo.
echo [3/4] Starting backend services (keeping existing containers)...
docker compose -f ../docker-compose.yml up --no-recreate -d postgres admin-service gateway signalr file-service
if errorlevel 1 goto :error

echo.
echo [4/4] Verifying services...
timeout /t 3 /nobreak
docker compose -f ../docker-compose.yml ps

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                  ✅ DEPLOYMENT COMPLETED                         ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  Backend Services URLs:
echo    • Admin API:  http://localhost:7028
echo    • Gateway:    http://localhost:5002
echo    • SignalR:    http://localhost:5003
echo    • Database:   localhost:5433 ^(postgres / 123456 / Host^)
echo.
echo  Frontend not deployed. To add frontend later, select option [1].
echo.
pause
goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:build_only
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    BUILDING IMAGES ONLY                          ║
echo ║                                                                  ║
echo ║     ^(Containers will NOT be started^)                            ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo Building all Docker images...
docker compose -f ../docker-compose.yml build
if errorlevel 1 goto :error

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                 ✅ BUILD COMPLETED                               ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  Images built successfully. To start services, run:
echo    docker compose up -d
echo.
echo  Or select option [1] or [2] from this menu to deploy.
echo.
pause
goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:stop_services
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    STOPPING SERVICES                             ║
echo ║                                                                  ║
echo ║     Containers and volumes will be PRESERVED                    ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo Stopping all services...
docker compose -f ../docker-compose.yml stop

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                 ✅ SERVICES STOPPED                              ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  All data preserved. To restart, select option [1] or [2].
echo.
pause
goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:stop_remove
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║              STOPPING & REMOVING CONTAINERS                      ║
echo ║                                                                  ║
echo ║     Containers removed but volumes/data PRESERVED               ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo Removing containers...
docker compose -f ../docker-compose.yml down

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║            ✅ CONTAINERS REMOVED                                 ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  Data in volumes preserved. To restart, select option [1] or [2].
echo.
pause
goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:full_cleanup
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                   ⚠️  FULL CLEANUP ⚠️                            ║
echo ║                                                                  ║
echo ║  This will DELETE everything including PostgreSQL data!        ║
echo ║  There is NO UNDO - all data will be LOST!                      ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
set /p confirm="Are you SURE? Type 'yes' to confirm: "
if /i not "%confirm%"=="yes" (
    echo.
    echo Cleanup cancelled.
    timeout /t 2 /nobreak
    goto :menu
)

echo.
echo ⚠️  DELETING ALL CONTAINERS AND VOLUMES...
docker compose -f ../docker-compose.yml down -v

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║           ✅ FULL CLEANUP COMPLETED                              ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo  Everything removed. To start fresh, select option [1] or [2].
echo.
pause
goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:view_status
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    SERVICE STATUS                                ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
docker compose -f ../docker-compose.yml ps

echo.
pause
goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:view_logs
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    VIEWING LOGS                                  ║
echo ║                                                                  ║
echo ║     Press Ctrl+C to stop viewing logs                           ║
echo ║                                                                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
docker compose -f ../docker-compose.yml logs -f

goto :menu

:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

:error
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                   ❌ ERROR OCCURRED                              ║
echo ║              Check logs for more details                        ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
pause
goto :menu

:exit
cls
echo.
echo Goodbye!
echo.
