# User Interface Design Goals

## Overall UX Vision
PokePot embraces a **"game night companion"** design philosophy - the interface should feel like a helpful friend who handles the boring math while staying out of the way during actual poker play. The visual design prioritizes **large, poker-friendly touch targets** optimized for use during games when hands might be holding cards or chips. Dark mode default reduces screen glare that could give away hand information, while maintaining the social warmth that groups expect from their poker nights.

## Key Interaction Paradigms
**Voice-First, Touch-Secondary:** Primary interactions happen through voice commands with visual confirmations, allowing players to keep hands free during active play. **One-Tap Critical Actions** for buy-ins and cash-outs minimize interaction complexity. **Ambient Information Display** shows key data (current balances, session time) without requiring active attention, similar to a poker chip rack that you glance at occasionally.

## Core Screens and Views
- **Session Setup Screen:** Local session creation and player onboarding hub
- **Live Game Dashboard:** Real-time balance display with voice command interface  
- **Buy-in/Cash-out Interface:** Large button interactions with voice confirmation
- **Settlement Summary Screen:** Final optimization results with WhatsApp sharing
- **Player Management Screen:** Saved profiles and session history access

## Accessibility: WCAG AA
Committed to WCAG AA compliance focusing on **high contrast ratios** for poker room lighting conditions, **large text sizes** readable from normal playing distance, and **voice navigation** as primary accessibility feature. Color coding includes shape/pattern alternatives for color-blind users, with audio cues supplementing visual feedback.

## Branding
**"Sophisticated Poker Room"** aesthetic combining the elegance of casino environments with the warmth of home game social settings. Deep greens and rich golds evoke traditional poker felt and chips, while modern typography maintains mobile-first usability. **Humor personality integration** allows visual themes to shift based on selected voice character (Vegas Dealer gets more neon, Drunk Uncle gets more casual styling).

## Target Device and Platforms: Mobile Native
**Mobile-first design** optimized for iOS and Android phones held in portrait mode during gameplay, with tablet landscape support for dedicated "app keeper" devices. Native React Native implementation enables installation through app stores while maintaining native-like performance for voice recognition and local database operations.
