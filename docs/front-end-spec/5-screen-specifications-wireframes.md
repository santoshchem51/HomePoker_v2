# 5. Screen Specifications & Wireframes

## 5.1 Party Dashboard Hub (Home Screen)
**Purpose:** Central celebration-focused entry point that adapts based on user state

**Layout:**
- Hero section with party branding and current session status
- Context-aware action cards (Create Game, Join Game, Resume Game)
- Recent games carousel with celebration highlights
- Quick stats: total games, biggest wins, favorite players

**Components:**
- `PartyWelcome` (Custom + shadcn Card)
- `ActionGrid` (shadcn Button + custom party styling)
- `RecentGamesCarousel` (React Native FlatList + shadcn Card)
- `QuickStats` (Custom visualization + shadcn Badge)

## 5.2 Live Game Dashboard (Primary Interface)
**Purpose:** Real-time balance display with context-aware floating actions

**Layout:**
- Poker table visualization with player balance cards arranged in circle
- Central pot display with animated chip stack
- Floating action buttons for voice commands and quick transactions
- Session timer and game status indicators

**Components:**
- `PokerTableLayout` (Custom React Native View)
- `PlayerBalanceCard` (Hybrid shadcn Card + custom animations)
- `CentralPot` (Custom ChipStack component)
- `FloatingActionPanel` (Custom TouchableOpacity + shadcn Button)
- `VoiceActivationButton` (Custom with microphone animation)

## 5.3 Settlement Summary Screen
**Purpose:** Final optimization results with social sharing celebration

**Layout:**
- Settlement optimization visualization (who pays whom)
- Total savings display (transactions reduced from X to Y)
- WhatsApp sharing options with message preview
- Celebration confetti animation on load

**Components:**
- `SettlementVisualization` (Custom flow diagram)
- `SavingsDisplay` (shadcn Card + celebration animations)
- `SharePanel` (shadcn Dialog + WhatsApp integration)
- `CelebrationOverlay` (Custom confetti animation)
