@echo off
REM Build Android Release with Java 17
set JAVA_HOME=C:\Users\saddagatla\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot
set ANDROID_HOME=C:\Users\saddagatla\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%
echo Building Android Release with Java 17...
echo JAVA_HOME set to: %JAVA_HOME%
echo ANDROID_HOME set to: %ANDROID_HOME%
cd android
gradlew.bat assembleRelease
cd ..
echo.
echo Build complete! Release APK location:
echo android\app\build\outputs\apk\release\app-release.apk