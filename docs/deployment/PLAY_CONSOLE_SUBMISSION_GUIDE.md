# Google Play Console Submission Guide

**For:** PokePot - Poker Session Manager  
**Developer:** Santosh Addagatla  
**Date:** August 17, 2025

---

## 🚀 Quick Start - Once Developer Account is Verified

### Step 1: Access Google Play Console
1. Go to: https://play.google.com/console
2. Sign in with your Google account
3. Accept developer terms if prompted

### Step 2: Create New App
1. Click **"Create app"**
2. Fill out basic information:
   - **App name:** `PokePot - Poker Session Manager`
   - **Default language:** English (United States)
   - **App type:** App
   - **Free or paid:** Free

3. Accept Play App Signing agreement
4. Click **"Create app"**

---

## 📱 App Setup - Complete These Sections

### Section 1: Store Listing
**Location:** Dashboard → Store listing

#### App Details
- **App name:** PokePot - Poker Session Manager
- **Short description:** Copy from template (77 characters)
- **Full description:** Copy from template (1,847 characters)

#### Graphics
1. **App icon:** Upload `docs/store-assets/icons/pokepot-icon.svg` (convert to 512x512 PNG if needed)
2. **Feature graphic:** Upload `docs/store-assets/feature-graphic.svg` (convert to 1024x500 PNG if needed)

#### Screenshots
Upload all 8 screenshots from `docs/store-assets/screenshots/`:
1. 01-main-dashboard-dark.png
2. 02-session-creation-dark.png  
3. 03-settings-appearance.png
4. 04-settings-light-mode.png
5. 05-main-dashboard-light.png
6. 06-session-with-players.png
7. 07-active-session.png
8. 08-settlement-calculations.png

#### Categorization
- **App category:** Tools
- **Tags:** Add poker, session, tracker, finance

#### Contact Details
- **Website:** (Optional)
- **Email:** pokepot.help2025@gmail.com
- **Phone:** (Your phone number)
- **Privacy Policy URL:** `https://santoshchem51.github.io/HomePoker_v2/docs/legal/privacy-policy.html`

### Section 2: App Content
**Location:** Dashboard → App content

#### Privacy Policy
- **URL:** `https://santoshchem51.github.io/HomePoker_v2/docs/legal/privacy-policy.html`
- Click **"Save"**

#### Data Safety
Complete the questionnaire based on template:
- **Data collection:** None
- **Data sharing:** None  
- **Security practices:** Local encryption, user can delete data

#### Content Rating
1. Click **"Start questionnaire"**
2. Answer all questions with "No" (see template for details)
3. Expected rating: **Everyone**
4. **Save** and **Submit**

#### Target Audience
- **Target age group:** 18+ (due to poker content)
- **Appealing to children:** No

#### News App
- **Is this a news app:** No

#### COVID-19 Contact Tracing
- **COVID-19 contact tracing:** No

#### Data Policy
- **Ads policy:** No ads
- **User data:** All local, no collection

### Section 3: Release Management
**Location:** Dashboard → Release → Production

#### Create New Release
1. Click **"Create new release"**
2. **App signing:** Use Play App Signing (recommended)

#### Upload App Bundle
1. **Upload:** `android/app/build/outputs/bundle/release/app-release.aab`
2. **Alternative:** Upload APK if AAB fails: `android/app/build/outputs/apk/release/app-release.apk`

#### Release Details
- **Release name:** 1.0.0 (auto-populated)
- **Release notes:** Copy from template

#### Review and Roll Out
1. **Rollout percentage:** Start with 20% (recommended)
2. **Review:** Check all warnings/errors
3. **Save** (don't roll out yet)

---

## ⚠️ Common Issues and Solutions

### Upload Issues
**Problem:** AAB upload fails  
**Solution:** Use APK instead, or check if bundle is properly signed

**Problem:** "You need to use a different package name"  
**Solution:** Check if package name conflicts (unlikely with com.pokepot)

**Problem:** Icon/graphic upload fails  
**Solution:** Convert SVG to PNG using online converter

### Content Issues
**Problem:** Legal URLs not accessible  
**Solution:** Verify GitHub Pages URLs work in incognito browser

**Problem:** Content rating issues  
**Solution:** Emphasize this is session tracking, not gambling

**Problem:** Data safety warnings  
**Solution:** Emphasize local-only storage, no data collection

### Review Issues
**Problem:** Rejected for gambling policy  
**Solution:** Appeal with explanation that this is session tracking tool

**Problem:** Privacy policy issues  
**Solution:** URL must be publicly accessible and comprehensive

---

## 📋 Pre-Submission Checklist

### Required Items ✅
- [x] Developer account verified
- [x] App bundle/APK built and signed
- [x] Store listing content prepared
- [x] Screenshots ready (8 total)
- [x] App icon ready (512x512)
- [x] Feature graphic ready (1024x500)
- [x] Privacy policy hosted and accessible
- [x] Legal documents complete

### Play Console Setup
- [ ] App created in Play Console
- [ ] Store listing complete
- [ ] Graphics uploaded
- [ ] Screenshots uploaded
- [ ] Privacy policy linked
- [ ] Data safety completed
- [ ] Content rating completed
- [ ] App bundle uploaded
- [ ] Release notes added

### Final Review
- [ ] All sections show green checkmarks
- [ ] No policy warnings
- [ ] Test legal document URLs
- [ ] Verify all information is accurate
- [ ] Check for typos in descriptions

---

## 🎯 Submission Process

### 1. Complete All Sections
Ensure every required section has a green checkmark:
- Store listing ✅
- App content ✅  
- Pricing and distribution ✅
- App releases ✅

### 2. Submit for Review
1. Go to **Release → Production**
2. Click **"Send for review"** 
3. Confirm submission

### 3. Review Timeline
- **Typical:** 2-3 hours
- **Complex apps:** Up to 7 days
- **First submission:** May take longer

### 4. Monitor Status
- Check email for updates
- Monitor Play Console dashboard
- Respond quickly to any requests

---

## 📊 Post-Launch Actions

### Day 1: Launch Day
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Verify app appears in search
- [ ] Test download and installation

### Week 1: Early Monitoring
- [ ] Increase rollout percentage gradually
- [ ] Address critical user feedback
- [ ] Monitor performance metrics
- [ ] Plan first update if needed

### Month 1: Growth Phase
- [ ] Analyze user behavior
- [ ] Plan feature updates
- [ ] Optimize store listing based on data
- [ ] Build user community

---

## 📞 Support and Resources

### If You Need Help
1. **Google Play Support:** Available in Play Console
2. **Developer Community:** Android Developer forums
3. **Documentation:** Google Play Console Help
4. **Email Support:** pokepot.help2025@gmail.com (for app-specific questions)

### Useful Links
- **Play Console:** https://play.google.com/console
- **Developer Policies:** https://play.google.com/about/developer-content-policy/
- **App Signing:** https://developer.android.com/studio/publish/app-signing
- **Store Listing:** https://developer.android.com/distribute/marketing-tools/store-listing

---

**🎉 You're Ready!** 

Everything is prepared for immediate submission once your developer account verification completes. The entire submission process should take 2-4 hours of focused work, and then 2-3 hours for Google's review process.

*Good luck with your app launch!*