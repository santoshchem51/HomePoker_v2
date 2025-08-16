@echo off
REM Build Android Release APK with Java 17
set JAVA_HOME=C:\Users\saddagatla\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
echo Building Android Release APK with Java 17...
echo JAVA_HOME set to: %JAVA_HOME%
cd android
gradlew.bat assembleRelease
cd ..
echo.
echo Build complete! APK location:
echo android\app\build\outputs\apk\release\app-release.apk