# iOS Deployment Guide: PokePot App to Apple App Store

**Complete step-by-step guide for deploying your React Native poker app to iOS devices and the Apple App Store.**

---

## Table of Contents

1. [Prerequisites & Requirements](#prerequisites--requirements)
2. [Apple Developer Account Setup](#apple-developer-account-setup)
3. [iOS App Configuration](#ios-app-configuration)
4. [Code Signing & Certificates](#code-signing--certificates)
5. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
6. [App Store Connect Setup](#app-store-connect-setup)
7. [Build & Upload Process](#build--upload-process)
8. [Testing & Distribution](#testing--distribution)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Maintenance & Updates](#maintenance--updates)

---

## Prerequisites & Requirements

### System Requirements
- ✅ **Your Windows machine**: Development environment (current setup)
- ✅ **GitHub Actions macOS runners**: iOS builds (already configured)
- ✅ **Internet connection**: For CI/CD and App Store operations
- ❌ **macOS/Xcode**: Not required (handled by CI/CD)

### Financial Requirements
- **Apple Developer Program**: $99/year (mandatory)
- **Optional**: App Store optimization tools (~$10-50/month)

### Technical Prerequisites
- ✅ React Native app (PokePot) - **COMPLETED**
- ✅ iOS project structure (`ios/` folder) - **COMPLETED**
- ✅ GitHub repository with CI/CD - **COMPLETED**
- ⏳ Apple Developer Account - **NEEDED**
- ⏳ App Store Connect access - **NEEDED**

---

## Apple Developer Account Setup

### Step 1: Create Apple Developer Account

1. **Visit**: [Apple Developer Portal](https://developer.apple.com/programs/)
2. **Sign up** with your Apple ID (create one if needed)
3. **Choose**: Individual ($99/year) or Organization ($99/year)
   - **Individual**: Simpler, faster approval
   - **Organization**: Better for business, requires D-U-N-S number
4. **Payment**: Provide credit card for annual fee
5. **Verification**: Wait 24-48 hours for approval

### Step 2: Access Developer Resources

Once approved, you'll have access to:
- **Certificates, Identifiers & Profiles**: Code signing materials
- **App Store Connect**: App submission and management
- **TestFlight**: Beta testing platform
- **Developer Documentation**: iOS guidelines and APIs

### Step 3: Understand Key Concepts

| Term | Purpose | Example |
|------|---------|---------|
| **Bundle ID** | Unique app identifier | `com.yourname.pokepot` |
| **Certificate** | Proves you're a verified developer | Development/Distribution certs |
| **Provisioning Profile** | Links certificates to devices/apps | Development/Ad Hoc/App Store profiles |
| **App Store Connect** | App submission and management portal | Upload builds, manage metadata |

---

## iOS App Configuration

### Step 1: Update App Metadata

Edit `ios/PokePot/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Identity -->
    <key>CFBundleDisplayName</key>
    <string>PokePot</string>
    <key>CFBundleIdentifier</key>
    <string>com.yourname.pokepot</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    
    <!-- Privacy Permissions -->
    <key>NSMicrophoneUsageDescription</key>
    <string>PokePot uses microphone for voice commands to record buy-ins and cash-outs during poker sessions.</string>
    <key>NSCameraUsageDescription</key>
    <string>PokePot uses camera for QR code scanning to join poker sessions.</string>
    
    <!-- Background Modes (if needed) -->
    <key>UIBackgroundModes</key>
    <array>
        <string>audio</string>
    </array>
    
    <!-- App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
    </dict>
    
    <!-- Supported Interface Orientations -->
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
```

### Step 2: Configure Bundle Identifier

**CRITICAL**: Choose a unique Bundle ID that you'll use everywhere:

Format: `com.yourname.pokepot` or `com.yourcompany.pokepot`

Examples:
- `com.johndoe.pokepot`
- `com.pokergames.pokepot`
- `com.homepoker.pokepot`

**Update in multiple locations:**
1. `ios/PokePot/Info.plist` → `CFBundleIdentifier`
2. `ios/PokePot.xcodeproj/project.pbxproj` → Search and replace bundle ID
3. Apple Developer Portal → App ID registration

### Step 3: App Icons and Assets

**Required iOS App Icons:**
- 20x20pt (1x, 2x, 3x) = 20px, 40px, 60px
- 29x29pt (1x, 2x, 3x) = 29px, 58px, 87px  
- 40x40pt (2x, 3x) = 80px, 120px
- 60x60pt (2x, 3x) = 120px, 180px
- 1024x1024px (App Store)

**Add to**: `ios/PokePot/Images.xcassets/AppIcon.appiconset/`

**App Store Screenshots** (prepare these):
- iPhone 6.7" (1290x2796) - Required
- iPhone 6.5" (1242x2688) - Required
- iPhone 5.5" (1242x2208) - Optional
- iPad Pro 12.9" (2048x2732) - If supporting iPad

---

## Code Signing & Certificates

### Step 1: Generate Certificates

**In Apple Developer Portal → Certificates, Identifiers & Profiles:**

1. **iOS Distribution Certificate** (for App Store):
   - Click "+" to create new certificate
   - Choose "iOS Distribution (App Store and Ad Hoc)"
   - Generate CSR (Certificate Signing Request):
     ```bash
     # On any Mac (or ask someone with Mac):
     # Keychain Access → Certificate Assistant → Request Certificate from CA
     # Save as: PokePot_Distribution.certSigningRequest
     ```
   - Upload CSR, download certificate (.cer file)

2. **iOS Development Certificate** (for testing):
   - Choose "iOS App Development"
   - Same CSR process
   - Download certificate

### Step 2: Register App ID

**In Apple Developer Portal → Identifiers:**

1. Click "+" to register new App ID
2. **Description**: PokePot - Poker Session Manager
3. **Bundle ID**: `com.yourname.pokepot` (exact match from Info.plist)
4. **Capabilities**: Select what your app uses:
   - ✅ Background Modes (if app runs in background)
   - ✅ Push Notifications (if you add them later)
   - ❌ Apple Pay (not needed for PokePot)
   - ❌ HealthKit (not needed)

### Step 3: Create Provisioning Profiles

**For App Store Distribution:**
1. **Type**: App Store
2. **App ID**: Select your PokePot app ID
3. **Certificate**: Select your iOS Distribution certificate
4. **Name**: PokePot App Store Profile
5. **Download**: Save as `PokePot_AppStore.mobileprovision`

**For Development/Testing:**
1. **Type**: iOS App Development
2. **App ID**: Select your PokePot app ID
3. **Certificate**: Select your iOS Development certificate
4. **Devices**: Select test devices (register UDIDs first)
5. **Name**: PokePot Development Profile
6. **Download**: Save as `PokePot_Development.mobileprovision`

### Step 4: Convert Certificates for CI/CD

**Convert .cer to .p12 format** (needed for GitHub Actions):

```bash
# On Mac or using OpenSSL:
# Import .cer into Keychain, then export as .p12
# Or use online converter (ensure security)

# You'll need:
# - PokePot_Distribution.p12 (with password)
# - PokePot_Development.p12 (with password)
```

---

## CI/CD Pipeline Configuration

### Step 1: Add Secrets to GitHub

**In your GitHub repository → Settings → Secrets and variables → Actions:**

Add these secrets:

```
IOS_DISTRIBUTION_CERTIFICATE_BASE64
IOS_DISTRIBUTION_CERTIFICATE_PASSWORD
IOS_DEVELOPMENT_CERTIFICATE_BASE64
IOS_DEVELOPMENT_CERTIFICATE_PASSWORD
IOS_DISTRIBUTION_PROVISIONING_PROFILE_BASE64
IOS_DEVELOPMENT_PROVISIONING_PROFILE_BASE64
APPLE_ID_EMAIL
APPLE_ID_PASSWORD
APP_STORE_CONNECT_API_KEY_ID
APP_STORE_CONNECT_API_ISSUER_ID
APP_STORE_CONNECT_API_PRIVATE_KEY
```

**Convert files to Base64:**

```bash
# Convert .p12 certificates to base64:
base64 -i PokePot_Distribution.p12 -o dist_cert.txt
base64 -i PokePot_Development.p12 -o dev_cert.txt

# Convert .mobileprovision files to base64:
base64 -i PokePot_AppStore.mobileprovision -o appstore_profile.txt
base64 -i PokePot_Development.mobileprovision -o dev_profile.txt

# Copy contents of .txt files to GitHub Secrets
```

### Step 2: Update iOS Build Workflow

Create `.github/workflows/ios-app-store-build.yml`:

```yaml
name: iOS App Store Build

on:
  push:
    tags:
      - 'v*.*.*'  # Trigger on version tags like v1.0.0
  workflow_dispatch:  # Manual trigger

jobs:
  build-ios-release:
    name: Build iOS for App Store
    runs-on: macos-latest
    timeout-minutes: 60
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Install CocoaPods
        run: |
          cd ios
          pod install --repo-update
        env:
          NO_FLIPPER: 1

      - name: Import Code Signing Certificates
        run: |
          # Create keychain
          security create-keychain -p "temp123" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "temp123" build.keychain
          security set-keychain-settings -t 3600 -u build.keychain
          
          # Import distribution certificate
          echo "${{ secrets.IOS_DISTRIBUTION_CERTIFICATE_BASE64 }}" | base64 --decode > dist_cert.p12
          security import dist_cert.p12 -P "${{ secrets.IOS_DISTRIBUTION_CERTIFICATE_PASSWORD }}" -k build.keychain -T /usr/bin/codesign
          
          # Set partition list
          security set-key-partition-list -S apple-tool:,apple: -s -k "temp123" build.keychain

      - name: Import Provisioning Profile
        run: |
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "${{ secrets.IOS_DISTRIBUTION_PROVISIONING_PROFILE_BASE64 }}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/PokePot_AppStore.mobileprovision

      - name: Build iOS Archive
        run: |
          cd ios
          xcodebuild archive \
            -workspace PokePot.xcworkspace \
            -scheme PokePot \
            -configuration Release \
            -destination 'generic/platform=iOS' \
            -archivePath build/PokePot.xcarchive \
            CODE_SIGN_IDENTITY="iPhone Distribution" \
            PROVISIONING_PROFILE_SPECIFIER="PokePot App Store Profile" \
            DEVELOPMENT_TEAM="${{ secrets.APPLE_TEAM_ID }}"

      - name: Export IPA
        run: |
          cd ios
          cat > ExportOptions.plist << EOF
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
          <dict>
              <key>method</key>
              <string>app-store</string>
              <key>teamID</key>
              <string>${{ secrets.APPLE_TEAM_ID }}</string>
              <key>uploadBitcode</key>
              <false/>
              <key>uploadSymbols</key>
              <true/>
              <key>compileBitcode</key>
              <false/>
          </dict>
          </plist>
          EOF
          
          xcodebuild -exportArchive \
            -archivePath build/PokePot.xcarchive \
            -exportPath build/ipa \
            -exportOptionsPlist ExportOptions.plist

      - name: Upload IPA to App Store Connect
        run: |
          xcrun altool --upload-app \
            --type ios \
            --file "ios/build/ipa/PokePot.ipa" \
            --username "${{ secrets.APPLE_ID_EMAIL }}" \
            --password "${{ secrets.APPLE_ID_PASSWORD }}"

      - name: Upload IPA Artifact
        uses: actions/upload-artifact@v4
        with:
          name: PokePot-iOS-AppStore
          path: ios/build/ipa/PokePot.ipa
          retention-days: 30

      - name: Clean up Keychain
        if: always()
        run: |
          security delete-keychain build.keychain
          rm -f dist_cert.p12
```

### Step 3: Manual Build Workflow

Create `.github/workflows/ios-manual-build.yml` for testing:

```yaml
name: iOS Manual Build

on:
  workflow_dispatch:
    inputs:
      build_type:
        description: 'Build Type'
        required: true
        default: 'development'
        type: choice
        options:
          - development
          - app-store

jobs:
  build-ios:
    name: Build iOS App
    runs-on: macos-latest
    timeout-minutes: 45
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build iOS (${{ github.event.inputs.build_type }})
        run: |
          cd ios
          pod install --repo-update
          
          if [ "${{ github.event.inputs.build_type }}" = "app-store" ]; then
            # App Store build with signing
            echo "Building for App Store..."
            # Add signing steps here
          else
            # Development build without signing
            echo "Building for development..."
            xcodebuild build \
              -workspace PokePot.xcworkspace \
              -scheme PokePot \
              -configuration Debug \
              -destination 'generic/platform=iOS Simulator'
          fi

      - name: Upload Build Logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: ios-build-logs-${{ github.event.inputs.build_type }}
          path: ios/build/Logs/
          retention-days: 7
```

---

## App Store Connect Setup

### Step 1: Create App in App Store Connect

1. **Login**: [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps** → **+** → **New App**
3. **Fill details**:
   - **Name**: PokePot
   - **Primary Language**: English
   - **Bundle ID**: Select your registered bundle ID
   - **SKU**: `pokepot-ios-app` (unique identifier)
   - **User Access**: Full Access

### Step 2: App Information

**Required Information:**
- **App Name**: PokePot
- **Subtitle**: Poker Session Manager
- **Description**: 
  ```
  PokePot is the ultimate poker session management app for home games. Track buy-ins, cash-outs, and settlements with ease. Features include voice commands, automatic calculations, and WhatsApp sharing.
  
  Key Features:
  • Voice-activated buy-in recording
  • Automatic settlement calculations
  • Session history and statistics
  • WhatsApp sharing integration
  • Offline-first design
  • Dark mode support
  
  Perfect for home poker games, tournaments, and casual sessions.
  ```
- **Keywords**: poker, game, cards, tracker, session, chips
- **Category**: Games → Card Games
- **Age Rating**: 17+ (Simulated Gambling)

### Step 3: Pricing and Availability

- **Price**: Free (Freemium model)
- **Availability**: All territories
- **App Store Distribution**: Available immediately after approval

### Step 4: App Privacy

**Privacy Policy**: Required for App Store
- Create privacy policy (see legal requirements section)
- Upload to your website or GitHub Pages
- Link in App Store Connect

**Data Collection**: Declare what data your app collects
- ❌ Contact Info
- ❌ Health & Fitness  
- ❌ Financial Info
- ✅ Usage Data (analytics)
- ✅ Identifiers (device ID for crash reporting)

---

## Build & Upload Process

### Step 1: Version Management

**Semantic Versioning**: Use format `MAJOR.MINOR.PATCH`
- **1.0.0**: Initial release
- **1.0.1**: Bug fixes
- **1.1.0**: New features
- **2.0.0**: Breaking changes

**Update version in**:
1. `package.json` → `"version": "1.0.0"`
2. `ios/PokePot/Info.plist` → `CFBundleShortVersionString`
3. Git tag: `git tag v1.0.0`

### Step 2: Build Process

**Automated Build** (recommended):
```bash
# Create version tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions automatically:
# 1. Builds IPA
# 2. Signs with certificates
# 3. Uploads to App Store Connect
# 4. Creates artifacts
```

**Manual Build** (if needed):
```bash
# Trigger manual workflow
# GitHub → Actions → iOS Manual Build → Run workflow
```

### Step 3: Upload to App Store Connect

**Automatic** (via CI/CD):
- IPA uploaded automatically via `altool`
- Check App Store Connect for processing

**Manual** (if CI/CD fails):
1. Download IPA from GitHub Actions artifacts
2. Use Xcode Organizer or Application Loader
3. Upload IPA to App Store Connect

### Step 4: TestFlight Beta Testing

**Before App Store submission**:
1. **Upload build** to App Store Connect
2. **Add beta testers** (up to 10,000)
3. **Internal testing**: Your team (up to 100 users)
4. **External testing**: Public beta testers
5. **Collect feedback** and fix issues

---

## Testing & Distribution

### Step 1: Internal Testing Strategy

**Pre-submission checklist**:
- ✅ App builds and launches successfully
- ✅ All features work as expected
- ✅ Voice commands functional (with fallback)
- ✅ Database operations stable
- ✅ WhatsApp sharing works
- ✅ Settlement calculations accurate
- ✅ No crashes or memory leaks
- ✅ Proper error handling
- ✅ iOS-specific UI looks good

### Step 2: TestFlight Beta Testing

**Beta Testing Plan**:
1. **Week 1**: Internal team testing (5-10 users)
2. **Week 2**: Close friends/family (20-30 users)
3. **Week 3**: Public beta (100+ users)
4. **Week 4**: Bug fixes and final testing

**TestFlight Setup**:
```yaml
# Add to your CI/CD workflow:
- name: Upload to TestFlight
  run: |
    xcrun altool --upload-app \
      --type ios \
      --file "ios/build/ipa/PokePot.ipa" \
      --username "${{ secrets.APPLE_ID_EMAIL }}" \
      --password "${{ secrets.APPLE_ID_PASSWORD }}"
```

### Step 3: App Store Review Process

**Timeline**: 1-7 days (usually 24-48 hours)

**Common rejection reasons**:
- Missing privacy policy
- Incomplete app information
- Crashes during review
- Guideline violations
- Missing required features

**Preparation checklist**:
- ✅ Complete app metadata
- ✅ High-quality screenshots
- ✅ Detailed app description
- ✅ Privacy policy published
- ✅ App tested on multiple devices
- ✅ Stable build without crashes

---

## Troubleshooting Guide

### Certificate and Signing Issues

**Problem**: "No matching provisioning profiles found"
```bash
# Solution:
1. Verify Bundle ID matches exactly in:
   - Info.plist
   - Apple Developer Portal
   - Provisioning Profile

2. Download fresh provisioning profile
3. Update GitHub Secrets with new base64 profile
4. Rebuild app
```

**Problem**: "Certificate has expired"
```bash
# Solution:
1. Generate new certificate in Apple Developer Portal
2. Convert to .p12 format
3. Update GitHub Secrets
4. Update provisioning profile
5. Retry build
```

**Problem**: "Code signing identity not found"
```bash
# Solution:
1. Check certificate import in CI logs
2. Verify certificate password in secrets
3. Ensure security set-key-partition-list command runs
4. Check keychain access permissions
```

### Build Failures

**Problem**: iOS build fails with dependency errors
```bash
# Solution:
1. Clear CocoaPods cache:
   cd ios && rm -rf Pods Podfile.lock
   pod install --repo-update

2. Update React Native dependencies:
   npm update

3. Check iOS deployment target compatibility:
   ios/Podfile: platform :ios, '12.0'
```

**Problem**: "Archive failed" in Xcode build
```bash
# Solution:
1. Check scheme configuration
2. Verify signing settings
3. Clean build folder: Product → Clean Build Folder
4. Update bundle identifier
5. Check for conflicting certificates
```

**Problem**: Memory issues during build
```bash
# Solution:
1. Increase GitHub Actions timeout
2. Optimize build settings:
   SWIFT_COMPILATION_MODE = wholemodule
   SWIFT_OPTIMIZATION_LEVEL = -O
3. Reduce parallel build processes
4. Use release configuration for archive
```

### App Store Connect Issues

**Problem**: "Invalid Binary" after upload
```bash
# Causes & Solutions:
1. Missing required architectures:
   - Add arm64 and x86_64 to build settings
   
2. Invalid Info.plist:
   - Validate all required keys present
   - Check version format: "1.0.0"
   
3. Missing app icons:
   - Ensure all required icon sizes included
   - Validate icon format (PNG, no transparency)
   
4. Bitcode issues:
   - Disable bitcode in build settings
   - Update export options plist
```

**Problem**: App stuck in "Processing" state
```bash
# Solution:
1. Wait 15-30 minutes (normal processing time)
2. Check email for processing failure notifications
3. Verify upload completed successfully
4. Contact Apple Support if stuck >2 hours
```

**Problem**: TestFlight upload fails
```bash
# Solution:
1. Check altool command syntax
2. Verify Apple ID credentials
3. Use app-specific password instead of main password
4. Try xcrun notarytool for newer uploads
```

### Runtime Issues

**Problem**: App crashes on launch (iOS)
```bash
# Debugging steps:
1. Check iOS deployment target compatibility
2. Review crash logs in App Store Connect
3. Test on physical device vs simulator
4. Check for missing iOS-specific dependencies
5. Validate bundle resources included

# Common fixes:
- Update minimum iOS version in Podfile
- Add missing iOS frameworks
- Fix React Native metro configuration
```

**Problem**: Voice features not working on iOS
```bash
# Solution:
1. Add microphone permission to Info.plist:
   <key>NSMicrophoneUsageDescription</key>
   <string>PokePot uses microphone for voice commands</string>

2. Request permission in app:
   import { PermissionsAndroid } from 'react-native';
   
3. Test permission flow on device
4. Implement permission denied fallback
```

**Problem**: WhatsApp sharing not working
```bash
# Solution:
1. Check URL scheme configuration
2. Add WhatsApp to LSApplicationQueriesSchemes:
   <key>LSApplicationQueriesSchemes</key>
   <array>
       <string>whatsapp</string>
   </array>

3. Test on device with WhatsApp installed
4. Verify clipboard fallback works
```

### Performance Issues

**Problem**: App performance poor on older iOS devices
```bash
# Optimization strategies:
1. Enable Hermes engine (already enabled)
2. Optimize bundle size:
   - Remove unused dependencies
   - Enable tree shaking
   - Compress images

3. Profile memory usage:
   - Use Xcode Instruments
   - Check for memory leaks
   - Optimize large data operations

4. Database optimization:
   - Add proper indexes
   - Limit query results
   - Use transactions efficiently
```

### Deployment Pipeline Issues

**Problem**: GitHub Actions iOS build fails
```bash
# Common solutions:
1. Check macOS runner availability
2. Verify all secrets are set correctly
3. Update Xcode version in workflow:
   runs-on: macos-13  # or latest

4. Check build logs for specific errors
5. Test workflow with manual trigger first
```

**Problem**: Secrets not working in GitHub Actions
```bash
# Verification steps:
1. Check secret names exactly match workflow
2. Verify base64 encoding correct:
   base64 -i file.p12 | pbcopy
   
3. Test with minimal workflow first
4. Check repository access permissions
5. Verify branch protection rules allow secrets
```

---

## Maintenance & Updates

### Regular Maintenance Tasks

**Monthly**:
- ✅ Check certificate expiration dates
- ✅ Update dependencies (`npm audit`)
- ✅ Review App Store Connect analytics
- ✅ Monitor crash reports
- ✅ Update provisioning profiles if needed

**Quarterly**:
- ✅ Renew Apple Developer Program ($99/year)
- ✅ Update iOS deployment target
- ✅ Review and update privacy policy
- ✅ Performance optimization review
- ✅ Security audit

### Version Update Process

**For bug fixes** (1.0.0 → 1.0.1):
```bash
# 1. Fix bugs in code
# 2. Update version
npm version patch  # Updates package.json
git tag v1.0.1
git push origin v1.0.1

# 3. CI/CD automatically builds and uploads
# 4. Submit for review in App Store Connect
```

**For new features** (1.0.1 → 1.1.0):
```bash
# 1. Develop and test new features
# 2. Update version
npm version minor
git tag v1.1.0
git push origin v1.1.0

# 3. Update App Store description if needed
# 4. Create new screenshots if UI changed
# 5. Submit for review
```

### Monitoring and Analytics

**App Store Connect Analytics**:
- Downloads and installations
- User retention rates
- Crash reports and diagnostics
- Performance metrics
- User reviews and ratings

**External Tools** (optional):
- **Crashlytics**: Detailed crash reporting
- **Firebase Analytics**: User behavior tracking
- **App Store Optimization**: Keyword tracking

### Long-term Considerations

**iOS Version Support**:
- Support latest iOS version + 2 previous versions
- Update minimum iOS version annually
- Test on new iOS beta versions

**React Native Updates**:
- Update React Native every 6 months
- Test thoroughly before production release
- Follow React Native upgrade guides

**Apple Guidelines Compliance**:
- Review updated App Store guidelines quarterly
- Implement new privacy requirements
- Adapt to new iOS features and deprecations

---

## Emergency Procedures

### Critical App Store Issues

**App removed from store**:
1. Check email from Apple for violation details
2. Fix identified issues immediately
3. Submit updated version with detailed notes
4. Contact Apple Developer Support if unclear

**Critical bug in production**:
1. Prepare hotfix immediately
2. Use expedited review (if available)
3. Consider remotely disabling problematic features
4. Communicate with users via app update notes

### Certificate Emergencies

**Certificate expired unexpectedly**:
1. Generate new certificate immediately
2. Update all provisioning profiles
3. Update CI/CD secrets
4. Build and test new version
5. Submit emergency update

**Developer account suspended**:
1. Contact Apple Developer Support immediately
2. Review and address any violations
3. Prepare appeal if necessary
4. Have backup deployment strategy ready

---

## Success Metrics & KPIs

### Launch Success Indicators
- ✅ App approved within 7 days
- ✅ Zero critical crashes in first week
- ✅ 4.0+ star rating maintained
- ✅ <1% crash rate
- ✅ Voice features working for >80% users

### Long-term Success Metrics
- **User Retention**: 30% after 7 days, 15% after 30 days
- **App Store Rating**: Maintain 4.0+ stars
- **Crash Rate**: <0.5% across all versions
- **Update Adoption**: 80% within 30 days
- **Feature Usage**: Voice commands used by 60%+ users

---

## Conclusion

This comprehensive guide provides everything needed to successfully deploy PokePot to the Apple App Store. The combination of your existing Windows development environment and GitHub Actions CI/CD eliminates the need for macOS hardware while ensuring professional-quality iOS builds.

**Next immediate steps**:
1. ✅ Create Apple Developer Account ($99)
2. ✅ Configure certificates and provisioning profiles
3. ✅ Add secrets to GitHub repository
4. ✅ Test build pipeline with development profile
5. ✅ Submit first version to TestFlight

With this setup, you'll have a fully automated iOS deployment pipeline that handles building, signing, and distributing your app to both TestFlight and the App Store.

**Questions or issues?** Refer to the troubleshooting section or contact Apple Developer Support for account-specific problems.

---

*Last updated: August 2025*  
*Version: 1.0*  
*Next review: December 2025*