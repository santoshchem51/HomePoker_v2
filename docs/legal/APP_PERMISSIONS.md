# PokePot - App Permissions Documentation

**App Version:** 1.0.0  
**Last Updated:** August 17, 2025  
**For:** Google Play Store Submission

## Overview

PokePot follows the principle of **minimal permissions** and only requests access to features that are essential for core functionality or explicitly optional features that users can control.

## Required Permissions

### 1. Storage/External Storage Access
**Android Permission:** `WRITE_EXTERNAL_STORAGE`, `READ_EXTERNAL_STORAGE`

**Purpose:**
- Save exported files (PDF, CSV, JSON) to device storage
- Allow users to access and share their exported session data

**User Control:**
- ✅ Only activated when user explicitly chooses to export data
- ✅ Files saved to user-accessible Downloads folder
- ✅ User can revoke permission without affecting core app functionality

**Data Handling:**
- Only user-generated session data is written to storage
- No personal information beyond user-entered session data
- Files contain only data the user has input into the app

**Justification:**
Essential for export functionality which is a core feature allowing users to:
- Generate PDF reports for record-keeping
- Create CSV files for spreadsheet analysis
- Export JSON backups for data portability
- Share settlement information with other players

---

## Optional Permissions

### 2. Microphone Access
**Android Permission:** `RECORD_AUDIO`

**Purpose:**
- Enable optional voice commands for hands-free operation
- Allow users to input buy-ins and cash-outs via voice
- Improve accessibility for users who prefer voice input

**User Control:**
- ✅ Completely optional feature that can be disabled
- ✅ App functions fully without microphone access
- ✅ User prompted before first use of voice features
- ✅ Can be revoked in device settings without app impact
- ✅ In-app toggle to disable voice commands

**Data Handling:**
- Voice input processed locally on device only
- No audio data transmitted to external servers
- Uses device's built-in speech recognition
- No voice data stored permanently
- Processing happens in real-time and is discarded

**Privacy Protection:**
- No voice recordings saved
- No audio data leaves the user's device
- Uses Android's native speech recognition APIs
- User maintains full control over when microphone is active

**Justification:**
Enhances user experience by allowing:
- Hands-free session management during active poker games
- Improved accessibility for users with mobility limitations
- Faster data entry during busy game sessions
- Modern voice-first interaction paradigm

---

## Permissions NOT Requested

### Network/Internet Access
❌ **Not Requested**
- App works completely offline
- No data transmission to external servers
- No analytics or tracking capabilities
- No advertisements or third-party integrations

### Location Access
❌ **Not Requested**
- No need for user location information
- Session management doesn't require geographic data
- Privacy-focused design avoids unnecessary location tracking

### Camera Access
❌ **Not Requested**
- No camera functionality implemented
- QR code generation uses text-based methods
- No image capture or processing features

### Contacts Access
❌ **Not Requested**
- Player names are manually entered by user
- No automatic contact integration
- Respects user privacy by not accessing contact list

### Phone/SMS Access
❌ **Not Requested**
- WhatsApp sharing uses intent system, not direct SMS
- No phone call functionality
- No direct messaging capabilities

## Permission Request Flow

### Storage Permission
1. User chooses to export data (PDF/CSV/JSON)
2. System prompts for storage permission if not granted
3. User can grant or deny permission
4. If denied, export feature shows helpful message
5. User can retry export or use alternative sharing methods

### Microphone Permission
1. User enables voice commands in settings
2. System prompts for microphone permission on first voice command
3. User can grant or deny permission
4. If denied, voice features are disabled with helpful message
5. User can enable permission later in device settings

## Data Safety for Google Play Store

### Data Collection Summary
- **Personal Information:** None collected
- **Financial Information:** Stored locally only (user-entered amounts)
- **Location:** Not collected
- **Web Browsing:** Not collected
- **App Activity:** Not collected
- **Device Identifiers:** Not collected

### Data Sharing Summary
- **No data shared with third parties**
- **No data transmitted to external servers**
- **User controls all data export and sharing**

### Security Practices
- ✅ Data encrypted in transit (N/A - no transmission)
- ✅ Data encrypted at rest (SQLite with encryption)
- ✅ Users can request data deletion (app settings)
- ✅ Independent security review (internal code review)

## Compliance and Best Practices

### Google Play Policy Compliance
- ✅ Minimal permission principle followed
- ✅ Clear justification for each permission
- ✅ User control over optional features
- ✅ Transparent data handling practices
- ✅ No unnecessary data collection

### Privacy by Design
- ✅ Default privacy settings protect user data
- ✅ No data collection unless user-initiated
- ✅ Local-first architecture minimizes privacy risks
- ✅ User education about data handling

### Accessibility
- ✅ Voice commands improve accessibility
- ✅ Alternative input methods always available
- ✅ Clear UI for permission management
- ✅ Helpful error messages for denied permissions

## Testing and Validation

### Permission Testing
- ✅ App functionality verified with permissions denied
- ✅ Graceful degradation when optional permissions unavailable
- ✅ Clear user feedback for permission-dependent features
- ✅ No crashes or errors when permissions are revoked

### Security Testing
- ✅ No data leakage to external storage locations
- ✅ Proper file permissions for exported data
- ✅ Voice data handling verified as local-only
- ✅ Database security and encryption validated

## Contact for Permission Questions

For questions about app permissions or data handling:

**Developer Email:** [TO BE ADDED]  
**Privacy Contact:** [TO BE ADDED]  
**Support:** Available through Google Play Store

---

## Summary

PokePot's permission model prioritizes user privacy and control:

- **Minimal Permissions**: Only essential features require permissions
- **User Control**: All permissions can be revoked without breaking core functionality
- **Transparency**: Clear explanation of how each permission is used
- **Privacy First**: No unnecessary data collection or sharing
- **Local Processing**: All sensitive operations happen on user's device

This approach ensures users maintain full control over their data while enjoying a feature-rich poker session management experience.