# Bug Story: Incorrect Back Navigation (Swipe Gestures) on Critical Screens

## Bug ID: BUG-003
**Reported By**: Beta Testers  
**Date Reported**: 2025-08-20  
**Priority**: High  
**Severity**: Major (Navigation/Data integrity issue)  

## Description
Back navigation via swipe gestures (sliding right or left on the screen) is incorrectly enabled on the Active Session and Settlement pages. This allows users to accidentally navigate away from critical screens during active game play and settlement calculations, potentially causing data loss or session state issues.

## Current Behavior
- On Active Session screen: Users can swipe to go back, potentially leaving an active game
- On Settlement screen: Users can swipe to navigate away during settlement calculations
- **Header navigation**: Back button/arrow visible in top navigation bar on critical screens
- Swipe gestures work when they should be disabled on these critical screens
- Multiple ways to accidentally navigate away (swipe, header button, hardware back)
- May cause confusion about session state or lost data

## Expected Behavior
- **Active Session screen**: Swipe back navigation should be DISABLED
- **Settlement screen**: Swipe back navigation should be DISABLED
- **Header navigation**: Remove or hide back button/arrow from navigation bar on these screens
- Users should only be able to navigate using explicit action buttons (End Session, Complete Settlement, etc.)
- Hardware back button (Android) should also be handled appropriately with confirmation
- No navigation controls that allow leaving without explicit user intent
- Prevent accidental navigation that could disrupt game flow

## Steps to Reproduce
1. Create a new poker session
2. Start the session (navigate to Active Session screen)
3. Try multiple navigation methods:
   a. Tap the back button/arrow in the header navigation bar
   b. Swipe from left edge of screen to the right (iOS) or swipe right (Android)
   c. Press hardware back button (Android)
4. Observe: All methods allow navigation away from active session
5. Similar issue on Settlement page - multiple ways to accidentally leave

## Affected Components
- Navigation configuration (React Navigation)
- `src/navigation/AppNavigator.tsx` or similar navigation setup
- `src/components/session/ActiveSession.tsx`
- `src/components/settlement/Settlement.tsx`
- Screen options and navigation listeners

## Technical Guidance for Developer

### Root Cause Investigation
React Navigation allows swipe gestures by default on iOS and some Android configurations. Critical screens need explicit configuration to disable this.

### Implementation Approach

```typescript
// 1. Disable swipe gestures on specific screens in navigation configuration

// In navigation screen options:
<Stack.Screen
  name="ActiveSession"
  component={ActiveSession}
  options={{
    gestureEnabled: false,    // iOS - disables swipe back
    swipeEnabled: false,      // Android - if using drawer/tab navigation
    headerLeft: () => null,   // Remove back button from header
    headerBackVisible: false, // Alternative way to hide back button
    headerShown: true,        // Keep header but remove navigation controls
    // OR completely hide header if not needed:
    // headerShown: false,
  }}
/>

<Stack.Screen
  name="Settlement"
  component={Settlement}
  options={{
    gestureEnabled: false,
    swipeEnabled: false,
    headerLeft: () => null,
    headerBackVisible: false,
    // Can also use custom header component
    // header: () => <CustomHeader title="Settlement" />
  }}
/>

// Alternative: Conditionally show back button with warning
options={{
  headerLeft: () => (
    <TouchableOpacity
      onPress={() => {
        Alert.alert(
          'Leave Session?',
          'Are you sure you want to leave the active session?',
          [
            { text: 'Stay', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() }
          ]
        );
      }}
    >
      <Icon name="arrow-back" />
    </TouchableOpacity>
  ),
}}

// 2. Handle hardware back button on Android
import { BackHandler } from 'react-native';

// In ActiveSession component:
useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      // Show confirmation dialog
      Alert.alert(
        'End Session?',
        'Are you sure you want to end the current session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Session', onPress: () => handleEndSession() }
        ]
      );
      return true; // Prevent default back action
    }
  );

  return () => backHandler.remove();
}, []);

// 3. Use navigation listeners to prevent navigation
navigation.addListener('beforeRemove', (e) => {
  if (!hasUnsavedChanges) {
    // No unsaved changes, allow navigation
    return;
  }

  // Prevent default behavior
  e.preventDefault();

  // Show confirmation
  Alert.alert(
    'Discard changes?',
    'You have an active session. Are you sure you want to leave?',
    [
      { text: "Don't leave", style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.dispatch(e.data.action),
      },
    ]
  );
});

// 4. Alternative: Use custom gesture handler
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Wrap critical screens to control gestures
<GestureHandlerRootView style={{ flex: 1 }}>
  <ActiveSessionContent />
</GestureHandlerRootView>
```

### Files to Check
1. **Navigation setup files**:
   - `src/navigation/AppNavigator.tsx`
   - `src/navigation/index.tsx`
   - Or wherever React Navigation is configured

2. **Screen components**:
   - `src/components/session/ActiveSession.tsx`
   - `src/components/settlement/Settlement.tsx`
   - `src/components/session/SessionScreen.tsx`

3. **Navigation types/config**:
   - Check for `screenOptions` or `options` props
   - Look for `gestureEnabled`, `swipeEnabled` settings

### Debugging Steps
```bash
# Find navigation configuration
grep -r "createStackNavigator\|Stack.Navigator" src/
grep -r "gestureEnabled\|swipeEnabled" src/

# Check header configuration
grep -r "headerLeft\|headerBackVisible\|headerShown" src/
grep -r "options=\|screenOptions=" src/navigation/

# Find screen components
grep -r "ActiveSession\|Settlement" src/navigation/

# Check for existing back handler
grep -r "BackHandler\|hardwareBackPress" src/

# Look for navigation listeners
grep -r "beforeRemove\|navigation.addListener" src/

# Check if custom headers are used
grep -r "header:\|Header" src/navigation/
```

## QA Testing Guide

### Pre-fix Verification
1. **Test all navigation methods on critical screens**:
   - Active Session: 
     - Try tapping back button in header
     - Try swiping from left edge
     - Try hardware back button (Android)
   - Settlement: 
     - Try tapping back button in header
     - Try swiping from left edge
     - Try hardware back button (Android)
   - Note: All methods incorrectly allow navigation

### Post-fix Validation

1. **Header Navigation Testing**:
   - [ ] Active Session: Back button/arrow NOT visible in header
   - [ ] Settlement: Back button/arrow NOT visible in header
   - [ ] Header still shows screen title if present
   - [ ] No clickable navigation elements in header

2. **Swipe Gesture Testing**:
   - [ ] Active Session: Swipe gestures should NOT work
   - [ ] Settlement: Swipe gestures should NOT work
   - [ ] Other screens: Swipe navigation should still work normally
   - [ ] Test on both iOS and Android devices

3. **Hardware Back Button (Android)**:
   - [ ] Active Session: Back button shows confirmation dialog
   - [ ] Settlement: Back button shows confirmation or is disabled
   - [ ] Confirmation dialog has clear options
   - [ ] Canceling keeps user on current screen

4. **Navigation Button Testing**:
   - [ ] Explicit navigation buttons (End Session, etc.) still work
   - [ ] Navigation is intentional, not accidental
   - [ ] No header back button to accidentally tap
   - [ ] No way to accidentally leave critical screens

5. **Edge Cases**:
   - [ ] Fast swiping doesn't bypass restrictions
   - [ ] Multiple swipe attempts don't break navigation
   - [ ] Screen rotation doesn't re-enable gestures
   - [ ] App backgrounding/foregrounding maintains restrictions

### Test Matrix
| Screen | Platform | Swipe Back | Hardware Back | Expected Result |
|--------|----------|------------|---------------|-----------------|
| Active Session | iOS | Disabled | N/A | Cannot swipe back |
| Active Session | Android | Disabled | Confirmation | Shows dialog |
| Settlement | iOS | Disabled | N/A | Cannot swipe back |
| Settlement | Android | Disabled | Confirmation | Shows dialog |
| Other Screens | Both | Enabled | Normal | Works normally |

### Session State Testing
- [ ] Session data persists even if navigation is attempted
- [ ] No data loss from blocked navigation attempts
- [ ] Session state remains consistent

## Acceptance Criteria
- [ ] Header back button/arrow removed from Active Session screen
- [ ] Header back button/arrow removed from Settlement screen
- [ ] Swipe back gestures disabled on Active Session screen
- [ ] Swipe back gestures disabled on Settlement screen
- [ ] Hardware back button properly handled with confirmation (Android)
- [ ] No accidental navigation from critical screens
- [ ] Clear user feedback when navigation is prevented
- [ ] Other screens maintain normal navigation behavior
- [ ] No regression in navigation functionality

## Priority Justification
**High Priority** because:
- Affects core gameplay experience and data integrity
- Users can accidentally lose session progress
- May cause confusion about session state
- Impacts user trust in the app's reliability
- Critical for maintaining proper game flow

## Notes
- Consider adding visual indicators that swipe is disabled (iOS navigation bar style)
- May want to add haptic feedback when swipe is attempted but blocked
- Document navigation flow in user guide
- Consider saving session state periodically as additional protection
- Evaluate if other screens need similar protection (e.g., during transaction entry)