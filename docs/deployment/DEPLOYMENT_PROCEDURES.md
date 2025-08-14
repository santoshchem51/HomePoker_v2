# PokePot Deployment Procedures

## Pre-Deployment Checklist

### Code Quality Validation
- [ ] All tests passing (`npm run test`)
- [ ] TypeScript compilation clean (`npm run typecheck`)
- [ ] Linting passes without errors (`npm run lint`)
- [ ] Performance benchmarks meet requirements
- [ ] Security audit completed
- [ ] Privacy compliance verified

### Build Validation
- [ ] Android release build successful
- [ ] iOS release build successful
- [ ] Bundle size under targets (<50MB APK, <100MB IPA)
- [ ] ProGuard/R8 optimization working
- [ ] Code signing certificates valid

### Content Preparation
- [ ] App store metadata complete
- [ ] Screenshots captured (all device sizes)
- [ ] App icons finalized (all sizes)
- [ ] Privacy policy published
- [ ] Support documentation ready

## Android Deployment

### Step 1: Prepare Release Signing

#### Generate Release Keystore (First Time Only)
```bash
# Navigate to android/app directory
cd android/app

# Generate release keystore (SECURE PROCESS)
keytool -genkeypair -v -storetype PKCS12 -keystore pokepot-release-key.keystore -alias pokepot-release -keyalg RSA -keysize 2048 -validity 10000

# Store keystore information securely:
# - Store password
# - Key alias: pokepot-release  
# - Key password
# - Keystore file: pokepot-release-key.keystore
```

#### Configure Signing in gradle.properties
```bash
# Add to android/gradle.properties (NOT in version control)
POKEPOT_RELEASE_STORE_FILE=pokepot-release-key.keystore
POKEPOT_RELEASE_KEY_ALIAS=pokepot-release
POKEPOT_RELEASE_STORE_PASSWORD=your_store_password
POKEPOT_RELEASE_KEY_PASSWORD=your_key_password
```

### Step 2: Build Release APK/AAB

#### Build APK (for testing)
```bash
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

#### Build Android App Bundle (for Play Store)
```bash
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Step 3: Validate Release Build

#### Check APK/AAB
```bash
# Analyze APK size and content
./gradlew assembleRelease --profile

# Install release APK for testing
adb install android/app/build/outputs/apk/release/app-release.apk

# Test critical flows:
# 1. App startup and performance
# 2. Session creation and management
# 3. Voice commands functionality
# 4. WhatsApp sharing
# 5. Database operations
```

### Step 4: Google Play Store Submission

#### Upload to Play Console
1. **Login to Google Play Console**
   - Navigate to https://play.google.com/console
   - Select PokePot app (or create new)

2. **Upload Bundle**
   - Go to Release → Production
   - Create new release
   - Upload `app-release.aab`
   - Add release notes

3. **Store Listing**
   - Update app description
   - Upload screenshots (phone & tablet)
   - Set app category: Tools
   - Content rating: Everyone
   - Privacy Policy: Link to published policy

4. **Review and Publish**
   - Complete all required sections
   - Submit for review
   - Monitor review status

## iOS Deployment

### Step 1: Prepare iOS Build Environment

#### Configure Xcode Project
```bash
cd ios

# Install CocoaPods dependencies
pod install --clean-install

# Open Xcode workspace
open PokePot.xcworkspace
```

#### Configure Signing & Capabilities
1. **In Xcode Project Settings:**
   - Bundle Identifier: `com.pokepot.app`
   - Team: Select your Apple Developer Team
   - Signing Certificate: Distribution certificate
   - Provisioning Profile: App Store distribution profile

2. **Required Capabilities:**
   - Voice Recognition (if using microphone)
   - Network (for WhatsApp sharing)

### Step 2: Build Release Archive

#### Create Archive
```bash
# Command line build (alternative to Xcode)
xcodebuild -workspace PokePot.xcworkspace \
           -scheme PokePot \
           -configuration Release \
           -destination 'generic/platform=iOS' \
           -archivePath PokePot.xcarchive \
           archive
```

#### Or Using Xcode:
1. Select "Generic iOS Device" as destination
2. Product → Archive
3. Wait for build completion
4. Archive will appear in Organizer

### Step 3: Validate Archive

#### Pre-Submission Validation
```bash
# Validate archive (command line)
xcodebuild -exportArchive \
           -archivePath PokePot.xcarchive \
           -exportOptionsPlist ExportOptions.plist \
           -exportPath ./build \
           -allowProvisioningUpdates
```

#### Testing Checklist
- [ ] App launches without crashes
- [ ] All core features functional
- [ ] Voice commands working
- [ ] WhatsApp integration functional
- [ ] Database operations smooth
- [ ] No debug logs in console
- [ ] App icon displays correctly
- [ ] Launch screen appears properly

### Step 4: App Store Connect Submission

#### Upload to App Store Connect
1. **Using Xcode Organizer:**
   - Select archive in Organizer
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Select distribution certificate
   - Upload and wait for processing

2. **Using Application Loader/Transporter:**
   - Export IPA from Xcode
   - Use Transporter app to upload

#### Complete App Store Connect Setup
1. **App Information:**
   - Name: PokePot - Poker Session Tracker
   - Subtitle: Track buy-ins, settlements, share
   - Category: Utilities
   - Age Rating: 4+

2. **Pricing and Availability:**
   - Price: Free
   - Availability: All countries
   - Release: Manual release after approval

3. **App Review Information:**
   - Contact info: developer@pokepot.app
   - Demo account: N/A (no login required)
   - Notes: Include testing instructions

4. **Version Information:**
   - What's New: Version 1.0 features
   - Build: Select uploaded build
   - Screenshot sets: Upload all device sizes

5. **Submit for Review**
   - Complete all required fields
   - Submit app for review
   - Monitor review status

## Post-Deployment Procedures

### Immediate Post-Launch (0-24 hours)

#### Monitor App Store Status
- [ ] Check app appears in stores
- [ ] Verify download/install process
- [ ] Test app functionality on fresh install
- [ ] Monitor crash reports
- [ ] Check initial user reviews

#### Performance Monitoring
- [ ] Activate production monitoring systems
- [ ] Verify analytics data collection
- [ ] Check error reporting integration
- [ ] Monitor server/API performance (if applicable)
- [ ] Track app store conversion metrics

### Short-term Monitoring (1-7 days)

#### User Experience Tracking
- [ ] Monitor user reviews and ratings
- [ ] Analyze crash reports and fix critical issues
- [ ] Track user engagement metrics
- [ ] Identify common user issues
- [ ] Respond to user feedback

#### Performance Analysis
- [ ] Review app performance metrics
- [ ] Analyze download and retention rates
- [ ] Check session completion rates
- [ ] Monitor feature usage analytics
- [ ] Assess battery and memory usage

### Long-term Maintenance (1+ weeks)

#### Regular Updates
- [ ] Plan feature updates based on feedback
- [ ] Schedule bug fix releases
- [ ] Monitor OS compatibility
- [ ] Update dependencies and security patches
- [ ] Maintain store listing optimization

#### Community Engagement
- [ ] Respond to all user reviews
- [ ] Engage with poker communities
- [ ] Gather feature requests
- [ ] Provide customer support
- [ ] Build user feedback channels

## Rollback Procedures

### Emergency Rollback Triggers
- Critical crashes affecting >5% of users
- Security vulnerabilities discovered
- Data corruption issues
- Major feature failures
- Significant performance degradation

### Rollback Process

#### App Store Connect
1. **Remove from Sale (iOS):**
   - Login to App Store Connect
   - Select app → Pricing and Availability
   - Uncheck all countries
   - Save changes

2. **Submit Previous Version:**
   - Create new version with previous build
   - Expedite review process
   - Include rollback reason in review notes

#### Google Play Store
1. **Halt Rollout:**
   - Go to Play Console → Release Management
   - Stop rollout immediately
   - Revert to previous version if needed

2. **Emergency Update:**
   - Upload fixed version
   - Use staged rollout for testing
   - Monitor metrics carefully

### Communication Plan
- [ ] Notify users through app update notes
- [ ] Post on social media/support channels
- [ ] Respond to user reviews explaining issue
- [ ] Provide ETA for resolution
- [ ] Follow up when issue is resolved

## Security Considerations

### Pre-Deployment Security Review
- [ ] Code obfuscation enabled
- [ ] Debug logs removed from production
- [ ] API keys secured (not in code)
- [ ] Certificate pinning configured
- [ ] Data encryption verified
- [ ] Privacy policy compliance checked

### Production Security Monitoring
- [ ] Set up security alerts
- [ ] Monitor for reverse engineering attempts
- [ ] Track suspicious usage patterns
- [ ] Regular security updates
- [ ] Incident response plan ready

## Compliance and Documentation

### Required Documentation
- [ ] Privacy policy published and linked
- [ ] Terms of service (if applicable)
- [ ] Data handling documentation
- [ ] Security assessment report
- [ ] App store compliance verification

### Regulatory Compliance
- [ ] GDPR compliance for EU users
- [ ] CCPA compliance for California users
- [ ] App store policy compliance
- [ ] Age rating accuracy
- [ ] Content rating compliance

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Responsible Team**: Development & DevOps  
**Next Review**: Pre-launch final review