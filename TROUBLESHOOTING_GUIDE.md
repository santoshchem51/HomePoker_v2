# React Native App Troubleshooting Guide
**Project:** HomePoker_v2 (PokePot)  
**Date:** 2025-08-12  
**Platform:** React Native 0.80.2 with Android Emulator on WSL2

## Critical Issues Found & Solutions

### 1. Database Initialization Hang 🔴 **CRITICAL**

**Problem:**
- App stuck on "Initializing PokePot..." screen indefinitely
- SQLite database initialization never completed
- No error messages or recovery options for users

**Root Cause:**
```typescript
// Missing method in DatabaseService.ts
private trackQueryPerformance(query: string, executionTime: number): void {
  // Method was called but not implemented
}

// Undefined variable causing iteration failure
for (const indexQuery of indexes) { // 'indexes' was undefined
```

**Solution:**
```typescript
// Added missing method in DatabaseService.ts:258-269
private trackQueryPerformance(query: string, executionTime: number): void {
  const queryType = query.trim().split(' ')[0].toUpperCase();
  if (!this.performanceMetrics[queryType]) {
    this.performanceMetrics[queryType] = [];
  }
  this.performanceMetrics[queryType].push(executionTime);
  
  // Keep only last 100 measurements per query type
  if (this.performanceMetrics[queryType].length > 100) {
    this.performanceMetrics[queryType] = this.performanceMetrics[queryType].slice(-100);
  }
}

// Fixed schema initialization in DatabaseService.ts:244-246
// Changed from:
for (const indexQuery of indexes) { // indexes was undefined
// To:
for (const schemaQuery of schemaTables) { // schemaTables contains all statements
```

**Prevention:**
- Always implement called methods, even if empty initially
- Use TypeScript strict mode to catch undefined variables
- Add comprehensive error handling and timeouts for database operations

---

### 2. Metro Bundler Port Configuration 🟡 **HIGH**

**Problem:**
- "Unable to load script" error on Android emulator
- App showing Metro connection failures
- Inconsistent port usage (8081 vs 8082)

**Root Cause:**
- Metro bundler running on wrong port or not accessible to emulator
- ADB port forwarding not configured correctly
- React Native expects Metro on port 8081 by default

**Solution:**
```bash
# Kill any processes on Metro ports
npx kill-port 8081 && npx kill-port 8082

# Start Metro on correct port
npx react-native start --reset-cache

# Set up proper ADB port forwarding
adb reverse tcp:8081 tcp:8081

# Verify Metro is accessible
curl localhost:8081/status
```

**Prevention:**
- Always use default port 8081 for Metro unless specifically configured otherwise
- Set up ADB port forwarding before running React Native apps
- Test Metro connectivity with curl before debugging app issues

---

### 3. Java Version Mismatch 🟡 **HIGH**

**Problem:**
- Build failures with Java 21
- Gradle tasks failing with compiler capability errors
- Inconsistent Java environments

**Root Cause:**
```
Could not create task ':react-native-picker_picker:compileDebugJavaWithJavac'.
> Failed to calculate the value of task 'javaCompiler' property.
> Toolchain installation '/usr/lib/jvm/java-21-openjdk-amd64' does not provide required capabilities
```

**Solution:**
```bash
# Use Java 17 for React Native 0.80.2 builds
JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 npx react-native run-android

# Or set permanently for project
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

**Prevention:**
- Document required Java version for each React Native version
- Use .nvmrc equivalent for Java versions in projects
- Verify Java version compatibility before starting development

---

### 4. Metro Cache Corruption 🟡 **MEDIUM**

**Problem:**
- JavaScript bundle not updating with code changes
- Old cached bundles served instead of fresh code
- Development workflow broken

**Root Cause:**
- Metro cache holding stale JavaScript bundles
- Multiple cache locations not cleared simultaneously

**Solution:**
```bash
# Complete cache clearing sequence
rm -rf node_modules/.cache /tmp/react-* /tmp/metro-*
npm install
npx react-native start --reset-cache

# Alternative: Clear watchman cache if installed
watchman watch-del-all
```

**Prevention:**
- Clear Metro cache when seeing stale bundle issues
- Use `--reset-cache` flag when restarting Metro after code changes
- Consider automating cache clearing in development scripts

---

### 5. React Native SQLite Storage Configuration ⚠️ **LOW**

**Problem:**
- Build warnings about invalid package configuration
- SQLite storage package misconfiguration

**Issue:**
```
warn Package react-native-sqlite-storage contains invalid configuration: 
"dependency.platforms.ios.project" is not allowed.
```

**Solution:**
- Warning is non-blocking but indicates package needs updating
- Use `npx react-native config` to verify linking
- Consider migrating to more modern SQLite packages for React Native

---

## Development Environment Setup Checklist

### Prerequisites
- [ ] Java 17 installed and set as JAVA_HOME
- [ ] Android SDK and emulator configured
- [ ] ADB accessible from command line
- [ ] Node.js and npm/yarn installed

### Initial Setup
```bash
# 1. Install dependencies
npm install

# 2. Start Android emulator
# (via Android Studio or command line)

# 3. Set up ADB port forwarding
adb reverse tcp:8081 tcp:8081

# 4. Start Metro bundler
npx react-native start --reset-cache

# 5. Build and install app (separate terminal)
JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 npx react-native run-android
```

### Troubleshooting Workflow
1. **Check Metro connectivity**: `curl localhost:8081/status`
2. **Verify ADB devices**: `adb devices`
3. **Test bundle generation**: `curl -I localhost:8081/index.bundle?platform=android&dev=true`
4. **Clear caches if needed**: `npx react-native start --reset-cache`
5. **Use dev menu**: `adb shell input keyevent 82`

---

## Common Error Patterns & Quick Fixes

### "Unable to load script"
```bash
# Quick fix sequence
adb reverse tcp:8081 tcp:8081
adb shell input keyevent 82  # Open dev menu
# Tap "Reload" in dev menu
```

### "Build failed with exit code 1"
```bash
# Check Java version first
JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 ./gradlew -v
# Clean and rebuild
./android/gradlew -p android clean
JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 npx react-native run-android
```

### App hangs on initialization
```bash
# Check database initialization code
# Add timeout mechanisms
# Implement proper error handling
# Use adb logcat to see console logs
timeout 10 adb logcat | grep -E "(ReactNativeJS|Database|Error)"
```

---

## Production Readiness Notes

### Database Reliability
- ✅ Fixed: Missing method implementations
- ✅ Fixed: Undefined variable iterations  
- ✅ Added: Timeout handling for initialization
- 🔄 TODO: Add comprehensive error recovery mechanisms

### Performance Considerations
- Metro bundle size: ~4.8MB (within acceptable range)
- Database initialization timeout: 10 seconds (reasonable)
- Memory usage: Not yet validated on physical devices

### Testing Strategy
- ✅ Emulator testing functional
- 🔄 TODO: Test on multiple Android device types
- 🔄 TODO: Performance validation on low-end devices
- 🔄 TODO: Network interruption testing

---

## Tools & Commands Reference

### Essential Commands
```bash
# Metro management
npx react-native start --reset-cache
npx kill-port 8081

# ADB utilities  
adb devices
adb reverse tcp:8081 tcp:8081
adb shell input keyevent 82
adb logcat | grep ReactNativeJS

# Build commands
JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 npx react-native run-android
./android/gradlew -p android clean assembleDebug

# Cache clearing
rm -rf node_modules/.cache /tmp/react-* /tmp/metro-*
```

### Debugging Tools
- **Metro bundler**: `localhost:8081` (web interface)
- **React Native dev menu**: `adb shell input keyevent 82`
- **Android logs**: `adb logcat`
- **Bundle testing**: `curl localhost:8081/index.bundle?platform=android`

---

## Lessons Learned

1. **Always implement called methods** - Missing method implementations cause silent failures
2. **Port forwarding is critical** - React Native apps need ADB reverse proxy setup
3. **Java version matters** - React Native versions have specific Java requirements
4. **Cache clearing solves many issues** - When in doubt, clear Metro cache
5. **Error handling is essential** - Database operations need timeouts and recovery mechanisms

This guide should help prevent and quickly resolve similar issues in future React Native projects.