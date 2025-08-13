# Epic 2: Voice Integration & User Experience

**Expanded Goal:** Transform the basic calculator into an intuitive, hands-free poker companion by implementing voice-enabled buy-in logging and enhanced user interface features. This epic addresses the core differentiator - allowing players to track money without disrupting gameplay through voice commands and optimized touch interfaces.

## Story 2.1: Voice Recognition Infrastructure Setup

As a **developer**,
I want **to integrate on-device speech recognition APIs for iOS and Android**,
so that **voice commands can be processed locally without network dependencies**.

### Acceptance Criteria
1. iOS Speech Recognition framework integrated with proper permissions handling
2. Android SpeechRecognizer API integrated with microphone permissions
3. Voice activation triggered by dedicated button press (not always-listening)
4. Audio feedback confirms voice recording start/stop states
5. Fallback error handling when voice recognition unavailable
6. Voice processing completes within 500ms for basic commands

## Story 2.2: Voice-Enabled Buy-in Commands

As a **poker player**,
I want **to add buy-ins using voice commands like "Add John fifty dollars"**,
so that **I can track money without putting down cards or chips**.

### Acceptance Criteria
1. Voice parser recognizes player names from current session roster
2. Number recognition handles common formats ("fifty", "50", "five zero")
3. Confirmation dialog shows interpreted command before processing
4. Voice feedback confirms successful buy-in addition
5. Ambiguous commands prompt for clarification via voice or touch
6. Command vocabulary documented for user reference
7. Voice confidence threshold set at 0.7 (70%) for command acceptance
8. Commands below confidence threshold trigger manual confirmation

## Story 2.3: Enhanced Touch Interface for Buy-ins

As a **poker player**,
I want **large, poker-friendly touch targets for one-tap buy-in entry**,
so that **I can quickly log transactions even with cards in hand**.

### Acceptance Criteria
1. Quick-add buttons for common buy-in amounts ($20, $50, $100)
2. Player selection via large photo/avatar cards (minimum 88x88pt touch targets)
3. Custom amount entry with poker chip visual calculator
4. Swipe gestures for rapid player selection
5. Haptic feedback confirms successful transaction entry
6. Landscape mode support for tablet-based game management

## Story 2.4: QR Code Session Joining

As a **poker player**,
I want **to join a session by scanning a QR code on the organizer's device**,
so that **I can view my balance without requiring app installation**.

### Acceptance Criteria
1. QR code generation displays prominently on session screen
2. QR code contains session URL for web-based joining
3. Scanning opens mobile web view with player-specific balance display
4. Joined players can view but not modify their own transactions
5. Session supports up to 8 simultaneous QR connections
6. Connection status indicator shows active QR participants

## Story 2.5: Player Profile Management

As a **regular poker player**,
I want **my profile saved for quick selection in future games**,
so that **game setup is faster for our regular poker crew**.

### Acceptance Criteria
1. Player profiles store name, photo/avatar, and preferred buy-in amount
2. Profile creation during first session participation
3. Quick-select interface shows recent players first
4. Profile search/filter for groups with many saved players
5. Profile data stored locally with option to export/import
6. Guest player option for one-time participants

## Story 2.6: Voice Recognition Fallback and Manual Input

As a **poker player**,
I want **reliable manual input options when voice recognition fails or is unavailable**,
so that **I can always track transactions regardless of device capabilities or environment**.

### Acceptance Criteria
1. Automatic detection of voice recognition availability on app startup
2. Clear visual indicator when voice commands are unavailable
3. One-tap switch between voice and manual input modes
4. Manual input interface with same quick-action capabilities as voice
5. Graceful degradation when device doesn't support speech recognition
6. Error messages guide users to manual input when voice fails
7. Settings option to disable voice and use manual-only mode
8. All voice-initiated actions achievable through touch interface

## Story 2.7: Dark Mode and Visual Optimization

As a **poker player**,
I want **a dark interface optimized for dim poker room lighting**,
so that **screen glare doesn't reveal hand information or strain eyes**.

### Acceptance Criteria
1. Dark mode enabled by default with high contrast text
2. Reduced blue light emission for evening gameplay
3. Brightness adjustment independent of system settings
4. Critical information visible from 2-3 feet distance
5. Color-blind friendly indicators using shapes and patterns
6. Minimal animations to reduce battery consumption
