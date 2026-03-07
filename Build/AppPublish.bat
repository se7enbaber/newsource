@echo off
echo ===================================================
echo     Build and Publish App Project
echo ===================================================

set BUILD_DIR=%~dp0
set ROOT_DIR=%BUILD_DIR%..
set OUTPUT_DIR=%BUILD_DIR%Release

echo Cleaning old releases...
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

echo.
echo [1/3] Publishing AdministrationService...
cd /d "%ROOT_DIR%\AdministrationService"
dotnet publish -c Release -o "%OUTPUT_DIR%\AdministrationService"

echo.
echo [2/3] Publishing GatewayService...
cd /d "%ROOT_DIR%\GatewayService"
dotnet publish -c Release -o "%OUTPUT_DIR%\GatewayService"

echo.
echo [3/3] Building Next.js Frontend...
cd /d "%ROOT_DIR%\my-nextjs"
call npm ci
call npm run build
:: Create frontend output
mkdir "%OUTPUT_DIR%\my-nextjs"
xcopy /E /I /Y /Q ".next" "%OUTPUT_DIR%\my-nextjs\.next"
xcopy /E /I /Y /Q "public" "%OUTPUT_DIR%\my-nextjs\public"
copy /Y "package.json" "%OUTPUT_DIR%\my-nextjs\"
copy /Y "package-lock.json" "%OUTPUT_DIR%\my-nextjs\"
copy /Y "next.config.ts" "%OUTPUT_DIR%\my-nextjs\"

echo.
echo ===================================================
echo Publish completed successfully!
echo Artifacts are located in: %OUTPUT_DIR%
echo ===================================================
pause
