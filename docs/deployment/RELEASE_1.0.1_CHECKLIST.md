# PokePot v1.0.1 Release Checklist - Bug Fix Release

## Release Information
- **Version**: 1.0.1
- **Version Code**: 2
- **Release Date**: August 18, 2025
- **Type**: Bug Fix Release

## 🐛 Bug Fixes Included

### 1. ValidationResult Pattern Fix
- **Issue**: Users saw generic "Session Error" pages instead of proper validation messages
- **Fix**: Modified TransactionService to return ValidationResult objects instead of throwing exceptions
- **Impact**: Better user experience with clear error messages

### 2. Session History Delete Button
- **Issue**: "no such table: scheduled_tasks" error when deleting sessions
- **Fix**: Added missing database migration 4 for scheduled_tasks and notification_queue tables
- **Impact**: Users can now properly delete sessions from history

### 3. Build Artifact Cleanup
- **Issue**: index.android.bundle was tracked in version control
- **Fix**: Removed from git and added to .gitignore
- **Impact**: Cleaner repository, no merge conflicts

## 📋 Pre-Build Checklist

### 1. Code Verification ✅
- [x] All bug fixes committed
- [x] Version numbers updated (versionCode: 2, versionName: "1.0.1")
- [ ] Run TypeScript check: `npm run typecheck`
- [ ] Run lint: `npm run lint`
- [ ] Run core tests: `npm run test:core`

### 2. Clean Build Environment
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Clear Metro cache
npx kill-port 8082
rm -rf $TMPDIR/metro-*
```

## 🏗️ Build Process

### 1. Build Release APK
```bash
# Set JAVA_HOME for Windows
set JAVA_HOME=C:\Users\saddagatla\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot

# Build signed release APK
cd android
./gradlew assembleRelease --no-daemon
cd ..
```

### 2. Build App Bundle (AAB) for Play Store
```bash
cd android
./gradlew bundleRelease --no-daemon
cd ..
```

### 3. Verify Build Outputs
- [ ] APK Location: `android/app/build/outputs/apk/release/app-release.apk`
- [ ] AAB Location: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] Check APK size (should be ~63-65 MB)
- [ ] Check AAB size (should be slightly smaller)

## 🧪 Testing Checklist

### 1. Install and Test on Device
```bash
# Uninstall old version
adb uninstall com.pokepot

# Install new version
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 2. Test Bug Fixes
- [ ] **ValidationResult Fix**: 
  - Try to cash out more than session pot
  - Verify you see a proper validation dialog, NOT "Session Error" page
  - Test with invalid amounts (negative, zero)
  
- [ ] **Session Delete Fix**:
  - Navigate to Session History
  - Delete a completed session
  - Verify deletion works without errors
  - Check toast message confirms deletion

### 3. Regression Testing
- [ ] Create new session (4-8 players)
- [ ] Add buy-ins for players
- [ ] Record cash-outs
- [ ] Test undo functionality (30-second window)
- [ ] Complete session and view settlement
- [ ] Export session (WhatsApp/PDF/CSV)
- [ ] Toggle dark/light mode
- [ ] Test voice commands (optional)

## 📝 Release Notes

### Version 1.0.1 (August 18, 2025)

**Bug Fixes:**
- Fixed validation errors showing generic "Session Error" instead of specific messages
- Fixed session deletion error in Session History ("scheduled_tasks table not found")
- Improved error handling and user feedback throughout the app
- Enhanced database migration system for better reliability

**Technical Improvements:**
- Implemented ValidationResult pattern for better error handling
- Added missing database migrations for task scheduling
- Improved deployment documentation and processes
- Removed build artifacts from version control

## 📤 Google Play Store Update

### 1. Update Store Listing
- [ ] Update "What's New" section with release notes
- [ ] Keep all other store assets (they haven't changed)

### 2. Upload New AAB
- [ ] Go to Google Play Console
- [ ] Navigate to Release > Production
- [ ] Create new release
- [ ] Upload `app-release.aab` (version 1.0.1)
- [ ] Add release notes from above

### 3. Rollout Strategy
- [ ] Start with 20% rollout
- [ ] Monitor crash reports for 24 hours
- [ ] If stable, increase to 50%
- [ ] Full rollout after 48-72 hours if no issues

## 🔍 Post-Release Monitoring

### Day 1 (First 24 hours)
- [ ] Check crash rate (should be < 0.1%)
- [ ] Monitor user reviews for new issues
- [ ] Check that bug fixes are working in production
- [ ] Respond to any user feedback

### Day 2-3
- [ ] Analyze usage metrics
- [ ] Verify database migrations working correctly
- [ ] Check for any new bug reports
- [ ] Consider increasing rollout percentage

### Week 1
- [ ] Full rollout if metrics are good
- [ ] Document any new issues for v1.0.2
- [ ] Update internal documentation

## ⚠️ Rollback Plan

If critical issues are found:
1. Pause the rollout immediately
2. Fix issues locally
3. Build version 1.0.2 (versionCode: 3)
4. Test thoroughly
5. Resume rollout with new version

## 📊 Success Criteria

- [ ] Crash rate remains below 0.1%
- [ ] No reports of "Session Error" generic messages
- [ ] Session deletion works for all users
- [ ] User ratings remain 4.0+ stars
- [ ] No critical bugs reported in first 48 hours

## 🎯 Final Checklist Before Upload

- [ ] All tests passing
- [ ] Version numbers updated
- [ ] Release notes prepared
- [ ] APK tested on physical device
- [ ] AAB file ready for upload
- [ ] Rollout strategy confirmed
- [ ] Team notified of release

---

## Commands Summary

```bash
# Quick build commands for v1.0.1
npm run typecheck
npm run lint
npm run test:core

# Build release
cd android
./gradlew clean
./gradlew assembleRelease --no-daemon
./gradlew bundleRelease --no-daemon
cd ..

# Test
adb uninstall com.pokepot
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

**Release Manager**: Santosh Addagatla  
**Release Date**: August 18, 2025  
**Version**: 1.0.1  
**Status**: Ready for Build