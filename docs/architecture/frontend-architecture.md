# Frontend Architecture

React Native mobile application architecture details:

## Component Architecture

### Component Organization
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── input.tsx
│   ├── poker/           # Poker-specific components
│   │   ├── PlayerCard.tsx
│   │   ├── BalanceDisplay.tsx
│   │   ├── TransactionForm.tsx
│   │   └── SettlementSummary.tsx
│   └── common/          # App-wide components
│       ├── Header.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── screens/             # Screen components
│   ├── Dashboard/
│   ├── SessionSetup/
│   ├── LiveGame/
│   └── Settlement/
├── navigation/          # Navigation configuration
└── hooks/               # Custom React hooks
```

## State Management Architecture

### State Structure
```typescript
// Zustand store for session management
interface SessionStore {
  // Session state
  currentSession: Session | null;
  players: Player[];
  transactions: Transaction[];
  
  // UI state
  isVoiceListening: boolean;
  lastVoiceCommand: VoiceCommandResult | null;
  celebrationQueue: CelebrationEvent[];
  
  // Actions
  setCurrentSession: (session: Session) => void;
  addPlayer: (player: Player) => void;
  addTransaction: (transaction: Transaction) => void;
  updatePlayerBalance: (playerId: string, balance: number) => void;
}
```

## Routing Architecture

### Route Organization
```
navigation/
├── AppNavigator.tsx        # Root navigator
├── AuthNavigator.tsx       # Device setup flow (first launch)
├── GameNavigator.tsx       # Main game flow stack
└── SettingsNavigator.tsx   # App settings and profiles

Routes:
/                          # Dashboard (session list)
/session/create           # New session setup  
/session/:id/setup       # Player management
/session/:id/live        # Live game dashboard
/session/:id/settlement  # Final settlement
/profiles                # Player profile management
/settings               # App settings
```
