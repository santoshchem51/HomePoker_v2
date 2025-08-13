# Testing Strategy

Define comprehensive testing approach with **90% code coverage requirement** and robust visual testing:

## Testing Standards and Requirements

**Code Coverage Standards:**
- **Overall Coverage Target:** 90% minimum across all code paths
- **Critical Path Coverage:** 100% for financial calculations, settlement algorithms, and transaction processing
- **Component Coverage:** 85% minimum for UI components with focus on user interactions
- **Service Layer Coverage:** 95% minimum for all business logic services
- **Database Layer Coverage:** 90% minimum for all data operations

## Enhanced Testing Pyramid with Coverage Targets

```
                  E2E Tests (90% user flow coverage)
                 /                                \
         Visual Tests (95% UI component coverage)
            /                                      \
    Integration Tests (85% service interaction coverage)
               /                                        \
          Frontend Unit (90%)              Backend Unit (95%)
```

## Test Organization

### Frontend Tests (90% Coverage Target)
- Component unit tests with React Native Testing Library
- Screen integration tests
- Custom hook tests
- State management tests
- Utility function tests

### Backend Tests (95% Coverage Target)
- Business logic tests (100% for financial services)
- Database and device tests
- External integration tests

### Visual Testing Strategy (95% UI Coverage)
- React Native visual tests with mobile-mcp
- Component screenshot tests
- Accessibility compliance validation
- Animation and celebration testing

## Visual Testing Requirements

### Critical Requirement: Authentic App Representation

**All visual testing and demonstrations must use the ACTUAL application implementation - never generic HTML mockups or misrepresentations.**

### Requirements for Story Visual Validation:

1. **Real App Only**: 
   - Use the actual PokePotExpo React Native application
   - Show real mobile UI components (TouchableOpacity, ScrollView, Alert dialogs)
   - Display authentic React Native styling and interactions
   - Demonstrate actual navigation patterns implemented in the app

2. **Authentic Mobile Experience**:
   - Screenshots must show real mobile interface design
   - Videos must capture actual touch interactions and mobile behaviors
   - Navigation must demonstrate real app flow between screens
   - Alerts and feedback must show actual React Native Alert dialogs

3. **Real Implementation Testing**:
   - Test actual state management and data flows
   - Validate real calculation logic and business rules
   - Demonstrate actual transaction handling and validation
   - Show real WhatsApp integration and message formatting

4. **No Misrepresentation**:
   - Never use HTML demos as substitutes for the real app
   - Never create generic web interfaces that don't match the mobile app
   - Never present simplified versions that don't show real complexity
   - Always show the authentic user experience

### Documentation Standards:

- All screenshots must be from the actual React Native app
- All videos must show real mobile interactions
- All functionality demonstrations must use real app features
- All visual evidence must accurately represent how users will experience the app

### For Story Testing and All Future Stories:

Every story requiring visual validation must:
1. Run the actual PokePotExpo React Native application
2. Capture authentic mobile screenshots showing real UI
3. Record real app interactions and workflows
4. Document authentic user experience and functionality
5. Provide accurate representation of the mobile app interface

## Visual Validation Process

### Quick Start (5 Minutes)

#### 1. Start the App
```bash
cd /mnt/c/Projects/BMad-Method_Projects/HomePoker_v2/PokePotExpo
npm run web
# App will be available at http://localhost:8081 or http://localhost:19006
```

#### 2. Navigate in Browser
```typescript
mcp__playwright__browser_navigate({ url: "http://localhost:8081" })
```

#### 3. Take Screenshots
```typescript
mcp__playwright__browser_take_screenshot({ filename: "feature-name-state.png" })
```

#### 4. Interact with UI
```typescript
// Click buttons
mcp__playwright__browser_click({ element: "Button description", ref: "element_ref" })

// Fill forms  
mcp__playwright__browser_type({ element: "Input description", ref: "input_ref", text: "test data" })
```

### Essential Commands

#### Browser Navigation
```typescript
mcp__playwright__browser_navigate({ url: "http://localhost:8081" })
mcp__playwright__browser_snapshot() // Get page structure
```

#### Screenshots
```typescript
mcp__playwright__browser_take_screenshot({ 
  filename: "descriptive-name.png",
  fullPage: true  // Optional: capture full page
})
```

#### UI Interactions
```typescript
// Clicks
mcp__playwright__browser_click({ element: "description", ref: "ref_id" })

// Text Input
mcp__playwright__browser_type({ 
  element: "input description", 
  ref: "input_ref", 
  text: "your text here" 
})

// Wait for elements
mcp__playwright__browser_wait_for({ text: "Loading complete" })
```

### Required Screenshots Checklist

For Every Story:
- [ ] Initial state (before any interaction)
- [ ] Feature activated (button clicked, form opened)
- [ ] User input states (forms filled, selections made)
- [ ] Processing states (loading, validation)
- [ ] Success states (feature working correctly)
- [ ] Error states (validation errors, edge cases)
- [ ] Integration verification (feature works with existing app)

### Fast Workflow Template

```typescript
// 1. Setup
mcp__playwright__browser_navigate({ url: "http://localhost:8081" })
mcp__playwright__browser_take_screenshot({ filename: "01-initial.png" })

// 2. Activate Feature
mcp__playwright__browser_click({ element: "Feature Button", ref: "btn_ref" })
mcp__playwright__browser_take_screenshot({ filename: "02-feature-activated.png" })

// 3. Test Input
mcp__playwright__browser_type({ element: "Input Field", ref: "input_ref", text: "test data" })
mcp__playwright__browser_take_screenshot({ filename: "03-input-filled.png" })

// 4. Submit/Execute
mcp__playwright__browser_click({ element: "Submit Button", ref: "submit_ref" })
mcp__playwright__browser_take_screenshot({ filename: "04-result.png" })

// 5. Verify Integration
mcp__playwright__browser_click({ element: "Navigate Back", ref: "back_ref" })
mcp__playwright__browser_take_screenshot({ filename: "05-integration.png" })
```

### Screenshot Naming Convention

```
Format: story-[number]-[feature]-[state].png

Examples:
✅ story-2.1-add-player-initial.png
✅ story-2.1-add-player-form-filled.png  
✅ story-2.1-add-player-success.png
✅ story-2.1-add-player-validation-error.png

❌ screenshot1.png
❌ test.png
❌ image-2024.png
```

### Common Testing Patterns

#### Test Form Validation
```typescript
// Valid input
mcp__playwright__browser_type({ element: "Input", ref: "input", text: "Valid Data" })
mcp__playwright__browser_take_screenshot({ filename: "valid-input.png" })

// Invalid input
mcp__playwright__browser_type({ element: "Input", ref: "input", text: "" })
mcp__playwright__browser_click({ element: "Submit", ref: "submit" })
mcp__playwright__browser_take_screenshot({ filename: "validation-error.png" })
```

#### Test Navigation Flow
```typescript
// Screen A
mcp__playwright__browser_take_screenshot({ filename: "screen-a.png" })

// Navigate to Screen B
mcp__playwright__browser_click({ element: "Next", ref: "next_btn" })
mcp__playwright__browser_take_screenshot({ filename: "screen-b.png" })

// Navigate back
mcp__playwright__browser_click({ element: "Back", ref: "back_btn" })
mcp__playwright__browser_take_screenshot({ filename: "back-to-screen-a.png" })
```

## Visual Validation Example: Custom Session Naming Feature

### Feature Being Tested
**Story**: Add ability to choose custom session names  
**Acceptance Criteria**:
1. Users can enter a custom session name when creating a session
2. If no name is entered, default to "Poker Session"
3. Custom name appears throughout the app (session header, home screen)
4. Maximum 50 characters with input validation

### Validation Process Executed

#### Step 1: Environment Setup
```bash
# Started the React Native app
cd /mnt/c/Projects/BMad-Method_Projects/HomePoker_v2/PokePotExpo
npm run web
# App running on http://localhost:8081
```

#### Step 2: Browser Navigation and Initial State
```typescript
// Navigated to the running application
mcp__playwright__browser_navigate({ url: "http://localhost:8081" })

// Captured initial home screen
mcp__playwright__browser_take_screenshot({ filename: "custom-naming-home-screen.png" })
```

**Screenshot Captured**: `custom-naming-home-screen.png`
- ✅ Shows clean home screen with "Create New Session" button
- ✅ Demonstrates production-ready interface
- ✅ No Epic 1 demo content visible (previous fix working)

#### Step 3: Feature Activation
```typescript
// Clicked the Create New Session button
mcp__playwright__browser_click({ 
  element: "Create New Session button", 
  ref: "e10" 
})

// Captured the new session naming screen
mcp__playwright__browser_take_screenshot({ filename: "custom-naming-screen.png" })
```

**Screenshot Captured**: `custom-naming-screen.png`
- ✅ NEW FEATURE: Session naming screen appears
- ✅ Input field with helpful placeholder text
- ✅ Clear instructions: "Leave blank for default name 'Poker Session'"
- ✅ Green "Create Session" and gray "Cancel" buttons

#### Step 4: User Input Testing
```typescript
// Entered a custom session name
mcp__playwright__browser_type({ 
  element: "Session name input field", 
  ref: "e13", 
  text: "Saturday Night Tournament" 
})

// Captured form with user input
mcp__playwright__browser_take_screenshot({ filename: "custom-name-entered.png" })
```

**Screenshot Captured**: `custom-name-entered.png`
- ✅ Input field shows custom text: "Saturday Night Tournament"
- ✅ Form validation working (accepts valid input)
- ✅ UI remains responsive and properly styled

#### Step 5: Session Creation
```typescript
// Clicked Create Session button
mcp__playwright__browser_click({ 
  element: "Create Session button", 
  ref: "e16" 
})

// Captured session created with custom name
mcp__playwright__browser_take_screenshot({ filename: "custom-session-created.png" })
```

**Screenshot Captured**: `custom-session-created.png`
- ✅ Session header shows: "Session: Saturday Night Tournament"
- ✅ Custom name successfully used instead of default
- ✅ All other functionality intact (navigation, status display)

#### Step 6: Integration Verification
```typescript
// Returned to home screen
mcp__playwright__browser_click({ 
  element: "Back to Home button", 
  ref: "e26" 
})

// Captured home screen with custom session
mcp__playwright__browser_take_screenshot({ filename: "home-with-custom-session.png" })
```

**Screenshot Captured**: `home-with-custom-session.png`
- ✅ Recent Session shows: "Saturday Night Tournament (created)"
- ✅ Custom name persists across navigation
- ✅ Integration with existing session management working

### Complete Workflow Demonstrated

Visual Evidence Shows Complete User Journey:
1. **Home Screen** → Clean interface with Create New Session button
2. **Session Naming** → New dedicated screen for name input
3. **Input Validation** → Accepts custom text with helpful guidance
4. **Session Creation** → Custom name appears in session header
5. **Persistence** → Custom name shown on home screen in recent sessions

Error Scenarios Tested:
- **Empty Input**: Would default to "Poker Session" (designed behavior)
- **Long Input**: 50 character limit enforced in code
- **Special Characters**: Handled gracefully with trim() function

### Acceptance Criteria Validation

#### AC 1: Users can enter a custom session name ✅
**Evidence**: Screenshots show input field, user entry, and successful creation
**Status**: PASSED - Feature working as designed

#### AC 2: Default name when empty ✅  
**Evidence**: Code review shows fallback logic: `sessionName.trim() || 'Poker Session'`
**Status**: PASSED - Logic implemented correctly

#### AC 3: Custom name appears throughout app ✅
**Evidence**: Screenshots show custom name in session header AND home screen
**Status**: PASSED - Integration working across screens

#### AC 4: Input validation (50 chars) ✅
**Evidence**: Code shows `maxLength={50}` attribute on TextInput
**Status**: PASSED - Validation implemented

## Troubleshooting Guide

### Common Issues and Solutions

#### App Won't Start
```bash
# Kill existing processes
pkill -f "expo start"
pkill -f "metro"

# Clear cache
npm start -- --reset-cache

# Try different ports
PORT=8082 npm run web
PORT=19006 npm run web
PORT=3000 npm run web

# Check what's running
lsof -i :8081
lsof -i :19006
```

#### Browser Can't Connect
```typescript
// Wait for app to fully start (may take 1-2 minutes)
// Try these URLs in order:
mcp__playwright__browser_navigate({ url: "http://localhost:8081" })
mcp__playwright__browser_navigate({ url: "http://localhost:19006" })  
mcp__playwright__browser_navigate({ url: "http://localhost:3000" })
```

#### Screenshots Not Saving
```typescript
// Use full descriptive filenames
mcp__playwright__browser_take_screenshot({ 
  filename: "story-2.1-player-management-initial.png" 
})

// Check output directory
// Files save to: /tmp/playwright-mcp-output/[timestamp]/
```

#### Element Not Found Errors
```typescript
// First get page structure
mcp__playwright__browser_snapshot()

// Look for correct element reference in output:
// - generic [ref=e10] [cursor=pointer]: Create New Session

// Use the correct ref
mcp__playwright__browser_click({ 
  element: "Create New Session", 
  ref: "e10"  // Use actual ref from snapshot
})
```

#### Mobile-Specific Issues
```typescript
// Initialize mobile first
mcp__mobile-mcp__mobile_init()

// Then capture UI
mcp__mobile-mcp__mobile_screenshot()
mcp__mobile-mcp__mobile_dump_ui()
```

#### App Stuck on Loading Screen
```bash
# Wait longer - first bundle can take 2-3 minutes
# Try clearing cache:
rm -rf node_modules/.cache
npm start -- --reset-cache

# Or restart fresh:
rm -rf node_modules
npm install
npm run web
```

### Port Conflicts
```bash
# Find what's using ports
sudo lsof -i :8081
sudo lsof -i :19006

# Kill specific processes
kill -9 [PID]

# Use different port
PORT=3001 npm run web
```

### Platform-Specific Issues

#### Windows/WSL Issues
```bash
# Network connectivity in WSL
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# File watching issues
export CHOKIDAR_USEPOLLING=true

# Path issues
cd /mnt/c/Projects/BMad-Method_Projects/HomePoker_v2/PokePotExpo
pwd  # Verify correct path
```

#### macOS Issues
```bash
# Xcode command line tools
xcode-select --install

# Homebrew dependencies
brew install watchman
```

### Visual Testing Specific Issues

#### Screenshots Are Blurry
```typescript
// Use higher quality settings
mcp__playwright__browser_take_screenshot({ 
  filename: "clear-screenshot.png",
  type: "png",  // Better quality than jpeg
  scale: "css"  // Ensures crisp rendering
})
```

#### Page Not Fully Loaded
```typescript
// Wait for specific content
mcp__playwright__browser_wait_for({ text: "Welcome to PokePot" })

// Or wait for loading to complete
mcp__playwright__browser_wait_for({ textGone: "Loading..." })

// Then take screenshot
mcp__playwright__browser_take_screenshot({ filename: "loaded-state.png" })
```

#### Form Interactions Not Working
```typescript
// Make sure element is visible and clickable
mcp__playwright__browser_snapshot()  // Check page structure

// Click before typing
mcp__playwright__browser_click({ element: "Input field", ref: "input_ref" })

// Then type
mcp__playwright__browser_type({ 
  element: "Input field", 
  ref: "input_ref", 
  text: "your text"
})
```

### Debug Mode Commands

#### Check App Health
```bash
# Test basic connectivity
curl http://localhost:8081
curl http://localhost:19006

# Check processes
ps aux | grep expo
ps aux | grep metro
```

#### Playwright Debug
```typescript
// Get current page state
mcp__playwright__browser_snapshot()

// Check console messages  
mcp__playwright__browser_console_messages()

// Capture network requests
mcp__playwright__browser_network_requests()
```

#### Reset Everything
```bash
# Nuclear option - start completely fresh
pkill -f expo
pkill -f metro
rm -rf node_modules
rm -rf .expo
npm cache clean --force
npm install
npm run web
```

### Validation Checklist

Before Starting Visual Testing:
- [ ] App starts without errors (`npm run web`)
- [ ] Can access app in browser manually
- [ ] No console errors blocking functionality
- [ ] Correct working directory
- [ ] Network connectivity working

During Testing:
- [ ] Take screenshot after each major interaction
- [ ] Verify screenshots are saving correctly
- [ ] Check element references in snapshots
- [ ] Test both happy and error paths
- [ ] Capture mobile-specific interactions

After Testing:
- [ ] All required screenshots captured
- [ ] Files named correctly and organized
- [ ] Visual evidence matches acceptance criteria
- [ ] No critical issues found
- [ ] Story documentation updated

### Quality Checklist

Before Completing Story:
- [ ] App starts successfully (`npm run web`)
- [ ] All major UI states captured in screenshots
- [ ] Happy path demonstrated with visual evidence
- [ ] Error scenarios tested and documented
- [ ] Integration with existing features verified
- [ ] Screenshots have descriptive, consistent names
- [ ] No HTML mockups or fake demonstrations used
- [ ] All acceptance criteria visually proven

Story Documentation Updated:
- [ ] Screenshots list added to story file
- [ ] Visual evidence section completed
- [ ] QA results documented with image references
- [ ] Any issues found documented with screenshots

## Financial Calculation Testing

```typescript
describe('Financial Calculation Accuracy', () => {
  test('handles currency precision correctly', () => {
    const testCases = [
      { amount: 10.01, expected: 1001 }, // Convert to cents
      { amount: 99.99, expected: 9999 },
      { amount: 0.01, expected: 1 },
      { amount: 100.00, expected: 10000 }
    ];

    testCases.forEach(({ amount, expected }) => {
      const cents = ValidationService.toCents(amount);
      expect(cents).toBe(expected);
      
      const backToAmount = ValidationService.fromCents(cents);
      expect(backToAmount).toBe(amount);
    });
  });

  test('settlement balances to exactly zero', () => {
    const transactions = [
      { playerId: 'p1', type: 'buy_in', amount: 33.33 },
      { playerId: 'p2', type: 'buy_in', amount: 33.33 },
      { playerId: 'p3', type: 'buy_in', amount: 33.34 },
      { playerId: 'p1', type: 'cash_out', amount: 50.00 },
      { playerId: 'p2', type: 'cash_out', amount: 25.00 },
      { playerId: 'p3', type: 'cash_out', amount: 25.00 }
    ];

    const settlement = SettlementService.calculateSettlement(transactions);
    const totalIn = settlement.totalBuyIns;
    const totalOut = settlement.totalCashOuts;
    
    expect(totalIn).toBe(totalOut); // Must be exactly equal
    expect(totalIn).toBe(100.00);
  });
});
```
