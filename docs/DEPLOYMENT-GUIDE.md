# React Native Deployment & Troubleshooting Guide

## Overview
This guide documents critical deployment processes and troubleshooting techniques for React Native development with PokePot. Learn from our experience to avoid common pitfalls.

## Table of Contents
- [Critical Deployment Steps](#critical-deployment-steps)
- [Metro Bundler Cache Issues](#metro-bundler-cache-issues)
- [Deployment Verification](#deployment-verification)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Critical Deployment Steps

### 1. Development Deployment (JavaScript/TypeScript Changes)

```bash
# Step 1: Kill any running Metro bundler
npx kill-port 8082
# or on Windows:
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Metro"

# Step 2: Start Metro with cache reset (CRITICAL!)
npm start -- --reset-cache

# Step 3: Reload app on device/emulator
# Option A: Using ADB
adb shell input keyevent KEYCODE_R KEYCODE_R

# Option B: In Metro terminal
# Press 'r' to reload

# Option C: On device
# Shake device → Select "Reload"

# Step 4: Verify deployment
adb logcat -s ReactNativeJS | grep "DEPLOYMENT"
```

### 2. Production Build Deployment

```bash
# Clean build directories
cd android && ./gradlew clean && cd ..

# Build fresh APK with latest JavaScript bundled
JAVA_HOME="C:\Users\saddagatla\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot" \
  ./android/gradlew -p android assembleDebug --no-daemon

# Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Metro Bundler Cache Issues

### Understanding the Problem
Metro bundler aggressively caches JavaScript bundles for performance. This can cause:
- ✅ Fast development builds
- ❌ Stale code being served after changes
- ❌ "Phantom bugs" that were already fixed
- ❌ Hours wasted debugging non-existent issues

### Signs of Cache Problems
1. **Code changes don't reflect in app behavior**
2. **New console.logs don't appear**
3. **Fixed bugs still occurring**
4. **Deployment markers missing from logs**
5. **TypeScript changes not taking effect**

### Solution: Reset Metro Cache

```bash
# Method 1: Start with reset flag
npm start -- --reset-cache

# Method 2: Clear cache manually
npx react-native start --reset-cache

# Method 3: Nuclear option - clear all caches
watchman watch-del-all
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
npm start -- --reset-cache
```

---

## Deployment Verification

### 1. Add Deployment Markers

Always add deployment verification markers to critical files:

```typescript
// In App.tsx
console.log('🚀 APP DEPLOYMENT VERIFICATION: ' + new Date().toISOString());
console.log('🚀 VERSION: ValidationResult-Fix-v2.0');

// In modified services
console.log('🚀 DEPLOYMENT: TransactionService-' + new Date().toISOString());
```

### 2. Verify Markers in Logs

```bash
# Watch for deployment markers
adb logcat -s ReactNativeJS | grep -E "(🚀|DEPLOYMENT|VERSION)"

# Expected output:
# 08-18 11:13:25.544 I ReactNativeJS: 🚀 APP DEPLOYMENT VERIFICATION: 2025-08-18T15:13:25.544Z
# 08-18 11:13:25.544 I ReactNativeJS: 🚀 VERSION: ValidationResult-Fix-v2.0
```

### 3. Create Deployment Script

Create `scripts/deploy-dev.sh`:

```bash
#!/bin/bash
echo "🚀 Starting fresh deployment..."

# Kill Metro
echo "📍 Killing Metro bundler..."
npx kill-port 8082

# Start Metro with fresh cache
echo "📍 Starting Metro with cache reset..."
npm start -- --reset-cache &
sleep 5

# Reload app
echo "📍 Reloading app..."
adb shell input keyevent KEYCODE_R KEYCODE_R

# Check logs for verification
echo "📍 Checking deployment markers..."
timeout 5 adb logcat -s ReactNativeJS | grep "DEPLOYMENT"

echo "✅ Deployment complete!"
```

---

## Troubleshooting Guide

### Issue 1: Changes Not Appearing After Code Modification

**Symptoms:**
- Modified code but app behavior unchanged
- Console.logs not appearing
- Bug fixes not working

**Solution:**
```bash
# 1. Reset Metro cache
npx kill-port 8082
npm start -- --reset-cache

# 2. Force reload
adb shell input keyevent KEYCODE_R KEYCODE_R

# 3. Verify with deployment markers
adb logcat -s ReactNativeJS | grep "DEPLOYMENT"
```

### Issue 2: "Session Error" Instead of Validation Messages

**Symptoms:**
- Generic error pages instead of specific validation dialogs
- ServiceError exceptions in logs
- User sees system errors for business logic failures

**Root Cause:**
- ValidationResult pattern not properly implemented
- Exceptions thrown instead of returning ValidationResult objects

**Solution:**
```typescript
// ❌ WRONG - Throws exception
if (amount > sessionPot) {
  throw new ServiceError('INSUFFICIENT_POT', 'Not enough in pot');
}

// ✅ CORRECT - Returns ValidationResult
if (amount > sessionPot) {
  return ValidationHelper.failure(
    'INSUFFICIENT_POT',
    `Cannot cash out $${amount}. Only $${sessionPot} in pot.`,
    { title: '💰 Insufficient Pot' }
  );
}
```

### Issue 3: Build Failures with CMake/Native Dependencies

**Symptoms:**
- `configureCMakeDebug` failures
- Reanimated build errors
- Native module compilation issues

**Solution:**
```bash
# Skip CMake tasks that fail
./android/gradlew assembleDebug -x configureCMakeDebug -x buildCMakeDebug

# Or clean everything and rebuild
cd android
./gradlew clean
./gradlew assembleDebug --no-daemon
```

### Issue 4: Metro Can't Connect to Device

**Symptoms:**
- "Loading from 10.0.2.2:8081..." stuck
- Connection timeout errors
- Metro shows no connection

**Solution:**
```bash
# 1. Reverse port for emulator
adb reverse tcp:8081 tcp:8081

# 2. Check Metro is running
curl http://localhost:8081/status

# 3. Restart ADB
adb kill-server
adb start-server

# 4. Verify device connected
adb devices
```

### Issue 5: Slow Development Feedback Loop

**Symptoms:**
- Rebuilding APK for every JavaScript change
- 10+ minute wait times for simple fixes
- Unnecessary Gradle builds

**Solution:**
```bash
# ❌ DON'T rebuild APK for JS changes
./gradlew assembleDebug  # Unnecessary for JS changes!

# ✅ DO use Metro live reload
npm start -- --reset-cache
# Press 'r' in Metro to reload instantly
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Rebuilding APK for JavaScript Changes
**Why it's wrong:** APK rebuilds take 5-10 minutes. JavaScript changes only need Metro reload (5-10 seconds).

**When to rebuild APK:**
- Native module changes (Java/Kotlin)
- AndroidManifest.xml changes
- Gradle dependency updates
- First time setup

**When NOT to rebuild APK:**
- JavaScript/TypeScript changes
- React component updates
- State management changes
- Style modifications

### ❌ Mistake 2: Not Using Deployment Markers
**Why it's wrong:** No way to verify which code version is running.

**Best Practice:**
```typescript
// Always add deployment markers
const DEPLOYMENT_VERSION = 'FeatureName-v1.0-' + Date.now();
console.log('🚀 DEPLOYMENT:', DEPLOYMENT_VERSION);
```

### ❌ Mistake 3: Ignoring Metro Cache
**Why it's wrong:** Wastes hours debugging "fixed" bugs.

**Best Practice:**
```bash
# Always reset cache when debugging weird issues
npm start -- --reset-cache
```

### ❌ Mistake 4: Not Checking Logs
**Why it's wrong:** Missing critical error information.

**Best Practice:**
```bash
# Always monitor logs during development
adb logcat -s ReactNativeJS

# Filter for errors
adb logcat -s ReactNativeJS *:E
```

---

## Quick Reference Commands

```bash
# 🔄 Reload JavaScript (fastest)
adb shell input keyevent KEYCODE_R KEYCODE_R

# 🧹 Reset Metro cache
npm start -- --reset-cache

# 📱 Check connected devices
adb devices

# 📋 View React Native logs
adb logcat -s ReactNativeJS

# 🔍 Check for deployment markers
adb logcat -s ReactNativeJS | grep "DEPLOYMENT"

# 🛑 Kill Metro bundler
npx kill-port 8082

# 🏗️ Build debug APK (when needed)
./android/gradlew assembleDebug

# 📦 Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 🔌 Reverse ports for emulator
adb reverse tcp:8081 tcp:8081
```

---

## Deployment Checklist

Before reporting "code not working":

- [ ] Killed Metro bundler (`npx kill-port 8082`)
- [ ] Started Metro with `--reset-cache`
- [ ] Reloaded app with `KEYCODE_R KEYCODE_R`
- [ ] Added deployment markers to verify version
- [ ] Checked logs for deployment markers
- [ ] Verified Metro shows "Reloading..."
- [ ] Checked for JavaScript errors in logs
- [ ] Confirmed device is connected (`adb devices`)

---

## Windows-Specific Tips

For Windows developers:

```batch
REM Kill Node/Metro processes
taskkill /F /IM node.exe

REM Use PowerShell for better commands
powershell -Command "Get-Process node | Stop-Process -Force"

REM Set JAVA_HOME for Android builds
set JAVA_HOME=C:\Users\[username]\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot

REM Use forward slashes in Git Bash
./android/gradlew assembleDebug
```

---

## Emergency Recovery

If nothing works:

```bash
# 1. Nuclear cache clear
watchman watch-del-all
rm -rf node_modules
rm -rf android/app/build
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*
npm install

# 2. Clean Android build
cd android && ./gradlew clean && cd ..

# 3. Reset Metro
npx react-native start --reset-cache

# 4. Rebuild everything
npm run build:android:debug

# 5. Verify with fresh install
adb uninstall com.pokepot
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Conclusion

Remember: **90% of "deployment issues" are just Metro cache problems**. Always try `--reset-cache` before spending hours debugging or rebuilding APKs.

**Golden Rule:** If your JavaScript changes aren't appearing, it's probably cache. Reset Metro, not your entire development environment.

Last updated: 2025-08-18