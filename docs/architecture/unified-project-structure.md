# Unified Project Structure

Complete monorepo structure for the React Native mobile application:

```plaintext
HomePoker_v2/
├── .github/                      # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml              # Testing and validation
│       ├── build-ios.yaml       # iOS app builds
│       └── build-android.yaml   # Android app builds
├── src/                         # Main application source
│   ├── components/              # React Native components
│   │   ├── ui/                  # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── input.tsx
│   │   ├── poker/               # Money tracking components
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── BalanceDisplay.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── SettlementSummary.tsx
│   │   │   └── VoiceCommandPanel.tsx
│   │   └── common/              # Shared components
│   │       ├── Header.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── screens/                 # Screen components
│   │   ├── Dashboard/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── RecentGames.tsx
│   │   ├── SessionSetup/
│   │   │   ├── CreateSessionScreen.tsx
│   │   │   └── PlayerManagement.tsx
│   │   ├── LiveGame/
│   │   │   ├── LiveGameScreen.tsx
│   │   │   ├── PlayerBalances.tsx
│   │   │   └── VoiceControls.tsx
│   │   └── Settlement/
│   │       ├── SettlementScreen.tsx
│   │       └── WhatsAppShare.tsx
│   ├── services/                # Business logic services
│   │   ├── core/
│   │   │   ├── SessionService.ts
│   │   │   ├── TransactionService.ts
│   │   │   ├── SettlementService.ts
│   │   │   └── ValidationService.ts
│   │   ├── infrastructure/
│   │   │   ├── DatabaseService.ts
│   │   │   ├── StorageService.ts
│   │   │   └── DeviceService.ts
│   │   └── integration/
│   │       ├── VoiceService.ts
│   │       ├── WhatsAppService.ts
│   │       └── QRService.ts
│   ├── stores/                  # Zustand state management
│   │   ├── sessionStore.ts
│   │   ├── voiceStore.ts
│   │   └── celebrationStore.ts
│   ├── navigation/              # React Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── GameNavigator.tsx
│   │   └── types.ts
│   ├── hooks/                   # Custom React hooks
│   │   ├── useVoiceCommands.ts
│   │   ├── useSessionData.ts
│   │   └── useCelebrations.ts
│   ├── utils/                   # Utility functions
│   │   ├── calculations.ts
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   ├── types/                   # TypeScript definitions
│   │   ├── session.ts
│   │   ├── player.ts
│   │   ├── transaction.ts
│   │   └── api.ts
│   └── styles/                  # Global styles and themes
│       ├── theme.ts
│       ├── colors.ts
│       └── typography.ts
├── assets/                      # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   └── poker-chips/
│   ├── sounds/                  # Celebration sound effects
│   │   ├── success.wav
│   │   └── celebration.wav
│   └── fonts/                   # Custom fonts
├── database/                    # SQLite schema and migrations
│   ├── schema.sql               # Database schema definition
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seeds/                   # Test data
│       └── sample_data.sql
├── tests/                       # Test files
│   ├── __tests__/
│   │   ├── services/            # Service tests
│   │   ├── components/          # Component tests
│   │   ├── screens/             # Screen tests
│   │   └── utils/               # Utility tests
│   ├── e2e/                     # End-to-end tests (Maestro)
│   │   ├── session-creation.yaml
│   │   ├── voice-commands.yaml
│   │   └── settlement-flow.yaml
│   ├── visual/                  # Visual regression tests
│   │   ├── mobile-mcp/          # mobile-mcp test configs
│   │   └── screenshots/         # Reference screenshots
│   └── fixtures/                # Test data
│       ├── sessions.json
│       └── players.json
├── scripts/                     # Build and utility scripts
│   ├── build.sh                 # Production build script
│   ├── test.sh                  # Test runner script
│   ├── cleanup-db.js            # Database maintenance
│   └── generate-icons.js        # App icon generation
├── docs/                        # Project documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   ├── architecture.md          # This document
│   ├── api-reference.md         # Service API documentation
│   └── deployment-guide.md
├── config/                      # Configuration files
│   ├── eslint.config.js
│   ├── jest.config.js
│   ├── metro.config.js          # React Native bundler config
│   └── tsconfig.json
├── android/                     # Android-specific files
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
├── ios/                         # iOS-specific files
│   ├── PokePot/
│   │   ├── Info.plist
│   │   └── AppDelegate.m
│   └── PokePot.xcodeproj/
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore patterns
├── .watchmanconfig              # React Native file watcher
├── babel.config.js              # Babel transpilation config
├── package.json                 # Dependencies and scripts
├── react-native.config.js       # React Native configuration
└── README.md                    # Project documentation
```
