@echo off
REM React Native Development Deployment Script for Windows
REM Ensures fresh JavaScript deployment without rebuilding APK

echo.
echo ====================================
echo   React Native Fresh Deployment
echo ====================================
echo.

REM Step 1: Kill Metro bundler
echo [1/4] Killing Metro bundler...
call npx kill-port 8082 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Metro" 2>nul
timeout /t 2 /nobreak >nul

REM Step 2: Start Metro with cache reset
echo [2/4] Starting Metro with cache reset...
start cmd /k "npm start -- --reset-cache"
timeout /t 5 /nobreak >nul

REM Step 3: Reload app
echo [3/4] Reloading app on device...
"C:\Users\saddagatla\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell input keyevent KEYCODE_R KEYCODE_R

REM Step 4: Check deployment markers
echo [4/4] Checking deployment markers...
echo.
timeout /t 2 /nobreak >nul
"C:\Users\saddagatla\AppData\Local\Android\Sdk\platform-tools\adb.exe" logcat -d -s ReactNativeJS | findstr /C:"DEPLOYMENT" | findstr /C:"2025"

echo.
echo ====================================
echo   Deployment Complete!
echo ====================================
echo.
echo If you don't see deployment markers above:
echo 1. Check that Metro shows "Loading dependency graph, done"
echo 2. Try pressing 'r' in the Metro terminal
echo 3. Check device is connected: adb devices
echo.
echo To view live logs: adb logcat -s ReactNativeJS
echo.
pause