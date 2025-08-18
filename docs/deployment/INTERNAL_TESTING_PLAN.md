# PokePot - Internal Testing Plan

**App:** PokePot - Poker Session Manager  
**Developer:** Santosh Addagatla  
**Testing Period:** 3-5 days  
**Target Testers:** 5-10 people

---

## 🎯 Internal Testing Setup

### Step 1: Upload to Internal Testing Track (After Developer Verification)

1. **Go to Google Play Console:**
   - Navigate to your app dashboard
   - Click **Release** → **Testing** → **Internal testing**

2. **Create Internal Test Release:**
   - Click **Create new release**
   - Upload: `android/app/build/outputs/bundle/release/app-release.aab`
   - **Release name:** 1.0.0-internal
   - **Release notes:**
   ```
   🧪 Internal Testing - PokePot v1.0.0
   
   Thank you for testing PokePot! Please focus on:
   • Creating poker sessions (4-8 players)
   • Recording buy-ins and cash-outs
   • Testing settlement calculations
   • Trying export features (PDF, WhatsApp)
   • Voice commands (optional)
   
   Report any issues to: pokepot.help2025@gmail.com
   ```

3. **Save Release** (don't roll out yet)

### Step 2: Add Internal Testers

**Recommended Testers (5-10 people):**
- [ ] Family members with Android devices
- [ ] Friends who play poker
- [ ] Colleagues familiar with apps
- [ ] Tech-savvy contacts
- [ ] Different age groups (test accessibility)

**Add Testers:**
1. Go to **Testing** → **Internal testing** → **Testers**
2. Click **Create email list**
3. Add tester email addresses (Gmail accounts work best)
4. **Save**

### Step 3: Publish Internal Test
1. Return to **Internal testing** release
2. Click **Review release**
3. **Start rollout to Internal testing**
4. Copy the **testing link** provided

---

## 📧 Tester Communication

### Initial Invitation Email Template

```
Subject: 🃏 Help Test PokePot - Poker Session Manager (Internal Testing)

Hi [Name],

I'm excited to invite you to test my new Android app: PokePot - Poker Session Manager!

🎯 WHAT IS POKEPOT?
PokePot helps track poker sessions by managing buy-ins, cash-outs, and settlements. Perfect for home games and friendly tournaments.

📱 HOW TO GET THE APP:
1. Click this testing link: [TESTING_LINK_FROM_PLAY_CONSOLE]
2. Install from Google Play Store (shows as "Internal test")
3. The app will appear in your app library

🧪 WHAT TO TEST (5-10 minutes):
• Create a poker session with 4-6 players (use fake names)
• Add some buy-ins ($20, $50, etc.)
• Record cash-outs when "players leave"
• Check if settlement calculations look correct
• Try exporting to PDF or sharing via WhatsApp
• Test dark/light mode switching
• Try voice commands if you're comfortable

🐛 REPORT ISSUES:
• Email me: pokepot.help2025@gmail.com
• Include device info (phone model, Android version)
• Screenshots help if something looks wrong

⏰ TESTING PERIOD: 3-5 days
📞 QUESTIONS: Just reply to this email

Thanks for helping make PokePot better!

Best regards,
Santosh
pokepot.help2025@gmail.com
```

### Follow-up Reminder (Day 2)

```
Subject: 🃏 PokePot Testing - Quick Reminder

Hi [Name],

Just a friendly reminder about testing PokePot! If you haven't had a chance yet, even 5 minutes of testing would be incredibly valuable.

🎯 QUICK TEST (2 minutes):
1. Open PokePot
2. Create session → Add 4 players
3. Add a few buy-ins
4. Check if settlement math looks right

Any feedback (good or bad) helps improve the app!

Thanks!
Santosh
```

---

## 🧪 Testing Scenarios & Checklist

### Scenario 1: Basic Session Test (5 minutes)
**Goal:** Verify core functionality works

```
Test Steps:
□ Open PokePot app
□ Create new session: "Test Game"
□ Add 4 players: Alice, Bob, Charlie, Diana
□ Record buy-ins:
  - Alice: $50
  - Bob: $40  
  - Charlie: $60
  - Diana: $30
□ Record cash-outs:
  - Alice: $80 (winner)
  - Bob: $0 (lost everything)
  - Charlie: $50 (broke even)
  - Diana: $50 (small win)
□ Check settlement screen - should balance to $0
□ Try exporting to PDF
□ Test undo functionality (within 30 seconds)

Expected Result: Everything should calculate correctly
```

### Scenario 2: Voice Commands Test (3 minutes)
**Goal:** Test optional voice features

```
Test Steps:
□ Enable voice commands in settings
□ Try saying: "Add buy-in fifty dollars for Alice"
□ Try saying: "Cash out Bob thirty dollars"
□ Verify voice commands were interpreted correctly
□ Test fallback to manual input if voice fails

Expected Result: Voice should work but manual always available
```

### Scenario 3: Export & Sharing Test (3 minutes)
**Goal:** Verify export functionality

```
Test Steps:
□ Complete a session with multiple transactions
□ Export to PDF - should generate readable report
□ Export to CSV - should create spreadsheet-friendly data
□ Try WhatsApp sharing - should create settlement message
□ Test JSON export for backup

Expected Result: All export formats should work properly
```

### Scenario 4: Edge Cases Test (5 minutes)
**Goal:** Test app stability

```
Test Steps:
□ Create session with maximum players (8)
□ Add very large buy-in amounts ($1000+)
□ Test with $0 buy-ins
□ Force close app and reopen (data should persist)
□ Switch between dark/light modes
□ Test with poor network connection
□ Try creating multiple sessions

Expected Result: App should handle edge cases gracefully
```

---

## 📊 Feedback Collection

### Feedback Form Template
Send this to testers for structured feedback:

```
📱 PokePot Testing Feedback Form

DEVICE INFO:
• Phone model: ________________
• Android version: _____________
• App version: 1.0.0-internal

OVERALL EXPERIENCE (1-5 stars):
Rating: ⭐⭐⭐⭐⭐

SPECIFIC TESTING:
□ Session creation worked smoothly
□ Buy-in recording was intuitive  
□ Cash-out process was clear
□ Settlement calculations seemed accurate
□ Export features worked as expected
□ App performance was good
□ Voice commands worked (if tested)

ISSUES ENCOUNTERED:
□ App crashed
□ Calculations seemed wrong
□ Features didn't work as expected
□ Interface was confusing
□ Other: ________________________

SUGGESTIONS:
_________________________________
_________________________________

WOULD YOU USE THIS APP? Yes / No
Why? ___________________________

EMAIL THIS TO: pokepot.help2025@gmail.com
```

### Critical Issues to Watch For

**Immediate Fix Required:**
- [ ] App crashes during normal use
- [ ] Incorrect settlement calculations
- [ ] Data loss after app restart
- [ ] Cannot create sessions
- [ ] Export features completely broken

**Nice to Fix Before Launch:**
- [ ] Confusing user interface elements
- [ ] Voice commands not working well
- [ ] Performance issues on older devices
- [ ] Minor calculation edge cases

**Post-Launch Improvements:**
- [ ] Feature requests
- [ ] UI/UX suggestions
- [ ] Additional export formats
- [ ] New functionality ideas

---

## 📅 Testing Timeline

### Day 1: Setup & Launch
**Tasks:**
- [ ] Upload app to internal testing
- [ ] Add all testers
- [ ] Send invitation emails
- [ ] Create feedback tracking document

### Day 2-4: Active Testing
**Tasks:**
- [ ] Monitor tester participation
- [ ] Send reminder emails if needed
- [ ] Collect and review feedback
- [ ] Track critical issues
- [ ] Answer tester questions promptly

### Day 5: Analysis & Decision
**Tasks:**
- [ ] Compile all feedback
- [ ] Prioritize critical fixes
- [ ] Decide: Fix issues or proceed to production?
- [ ] Thank testers
- [ ] Plan production release

---

## 🔧 Issue Management

### Issue Tracking Template
Keep a simple log of reported issues:

```
ISSUE #1
Reporter: [Name]
Device: [Model, Android version]
Severity: Critical/High/Medium/Low
Description: [What happened]
Steps to reproduce: [How to recreate]
Status: Open/Fixed/Deferred
Fix planned: Yes/No

ISSUE #2
[Repeat format]
```

### Decision Criteria for Production

**Green Light (Proceed to Production):**
- ✅ No critical crashes
- ✅ Core calculations work correctly
- ✅ Data persistence works
- ✅ Export features functional
- ✅ Generally positive feedback

**Yellow Light (Fix Minor Issues):**
- ⚠️ Some UI confusion (can fix quickly)
- ⚠️ Voice commands problematic (can disable)
- ⚠️ Performance issues on older devices

**Red Light (Delay Launch):**
- ❌ Frequent crashes
- ❌ Incorrect calculations
- ❌ Data loss issues
- ❌ Core features broken

---

## 🎉 Post-Testing Actions

### Thank You Email to Testers

```
Subject: 🙏 Thank You for Testing PokePot!

Hi [Name],

Thank you so much for testing PokePot! Your feedback was incredibly valuable and helped make the app better.

🚀 WHAT'S NEXT:
Based on your feedback, PokePot will be launching on Google Play Store within the next few days!

🎁 AS A THANK YOU:
• You'll be among the first to know when it goes live
• You helped create something that will help poker players everywhere
• You're part of the PokePot story!

📧 STAY IN TOUCH:
I'll send you the Play Store link when it's live. Feel free to leave a review if you enjoyed testing!

Thanks again for your time and insights!

Best regards,
Santosh
pokepot.help2025@gmail.com
```

### Prepare for Production
After successful internal testing:
1. Address any critical issues
2. Update app if necessary
3. Move to Production release track
4. Follow the Google Play Console submission guide

---

**🎯 Success Metrics for Internal Testing:**
- 80%+ testers complete basic scenario
- No critical crashes or data loss
- Positive overall feedback (4+ stars average)
- Core functionality validated by real users

You're all set for a successful internal testing phase!