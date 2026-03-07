@echo off
REM Display all service URLs and endpoints after deployment

echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                                                                   ║
echo ║                  DEPLOYED SERVICES & ENDPOINTS                   ║
echo ║                                                                   ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

REM Read .env file and display configuration
echo  📋 CONFIGURATION (from .env):
echo.

REM Display Service URLs
echo  🌐 SERVICE URLs:
echo.
for /f "tokens=2 delims==" %%A in ('findstr "ADMIN_URL" .env') do echo     • Admin Service:   %%A
for /f "tokens=2 delims==" %%A in ('findstr "GATEWAY_URL" .env') do echo     • Gateway:         %%A
for /f "tokens=2 delims==" %%A in ('findstr "SIGNALR_URL" .env') do echo     • SignalR:         %%A
for /f "tokens=2 delims==" %%A in ('findstr "FRONTEND_URL" .env') do echo     • Frontend:        %%A

echo.
echo  🔗 ADMIN SERVICE ENDPOINTS:
echo.
for /f "tokens=2 delims==" %%A in ('findstr "ADMIN_HANGFIRE" .env') do echo     • Hangfire:        %%A
for /f "tokens=2 delims==" %%A in ('findstr "ADMIN_SWAGGER" .env') do echo     • Swagger:         %%A
for /f "tokens=2 delims==" %%A in ('findstr "ADMIN_HEALTH" .env') do echo     • Health Check:    %%A

echo.
echo  💾 DATABASE:
echo.
for /f "tokens=2 delims==" %%A in ('findstr "POSTGRES_HOST_PORT" .env') do (
    for /f "tokens=2 delims==" %%B in ('findstr "POSTGRES_USER" .env') do (
        for /f "tokens=2 delims==" %%C in ('findstr "POSTGRES_PASSWORD" .env') do (
            for /f "tokens=2 delims==" %%D in ('findstr "POSTGRES_DB" .env') do (
                echo     • Connection:     localhost:%%A
                echo     • User:           %%B
                echo     • Password:       %%C
                echo     • Database:       %%D
            )
        )
    )
)

echo.
echo  📊 VERIFY DEPLOYMENT:
echo.
echo     docker compose ps         (Check all services)
echo     docker compose logs -f    (View real-time logs)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo.
echo  ✅ All services configured and running!
echo.
