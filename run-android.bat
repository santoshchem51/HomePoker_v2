@echo off
REM Run Android with Java 17
set JAVA_HOME=C:\Users\saddagatla\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot
set ANDROID_HOME=C:\Users\saddagatla\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%
echo Running Android app with Java 17...
echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
call npx react-native run-android