@echo off
echo Building PokePot Production Release APK...
echo.

cd android

echo Setting JAVA_HOME...
REM Update this path to match your Java 17 installation
set JAVA_HOME=C:\Program Files\Java\jdk-17

echo Cleaning previous builds...
call gradlew clean

echo Building release APK...
call gradlew assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful!
    echo APK location: android\app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo Build failed! Please check the error messages above.
)

pause