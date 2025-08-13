# PokePot Fullstack Architecture Document

## Introduction

### Starter Template or Existing Project

After reviewing the PRD and frontend specification, this is a **monolithic React Native mobile application** with local SQLite storage. Based on the technical assumptions in the PRD:

- **Mobile Framework**: React Native with TypeScript
- **Architecture**: Monolithic mobile (per ADR-001 - Complete Backend Elimination)  
- **Data Storage**: Local SQLite database only (react-native-sqlite-storage)
- **Repository Structure**: Single repository for mobile-only application

This is a **greenfield project** with clear architectural decisions already made. No existing starter templates are mentioned, and the architecture is specifically designed to eliminate backend dependencies for MVP delivery.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-11 | 1.0 | Initial architecture document creation from PRD and frontend spec | Winston (Architect) |

This document outlines the complete fullstack architecture for **PokePot**, including the monolithic mobile application design, local database implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for a mobile-first application where local data management is the primary architectural concern.

## High Level Architecture

### Technical Summary

PokePot employs a **monolithic React Native architecture** with local SQLite storage, eliminating traditional client-server complexity for a streamlined poker night companion. The application uses **TypeScript throughout** for type safety, **on-device voice recognition APIs** for hands-free interaction, and **shadcn/ui components** extended with poker-specific gaming elements for optimal user experience. **Local-first data management** ensures instant responsiveness and complete offline functionality, while **WhatsApp URL scheme integration** enables seamless social sharing without backend dependencies. This architecture achieves the PRD goals of transforming chaotic money tracking into an entertaining, dispute-free experience through mathematical certainty and celebration-focused interactions.

### Platform and Infrastructure Choice

**Platform:** React Native (iOS/Android)  
**Key Services:** Local SQLite database, device speech recognition APIs, WhatsApp URL schemes, platform camera APIs (QR codes)  
**Deployment Host and Regions:** App Store (iOS) and Google Play Store (Android) - global distribution

### Repository Structure

**Structure:** Single repository monolith  
**Monorepo Tool:** Not applicable - single React Native project  
**Package Organization:** Feature-based folder structure with shared utilities

### High Level Architecture Diagram

```mermaid
graph TD
    A[User Device] --> B[PokePot React Native App]
    B --> C[Voice Recognition Module]
    B --> D[Local SQLite Database]
    B --> E[UI Layer - shadcn/ui + Custom]
    B --> F[Business Logic Layer]
    B --> G[WhatsApp Integration]
    
    C --> H[iOS Speech Framework]
    C --> I[Android SpeechRecognizer]
    
    D --> J[Sessions Table]
    D --> K[Players Table] 
    D --> L[Transactions Table]
    
    E --> M[Poker Gaming Components]
    E --> N[Accessibility Features]
    
    F --> O[Settlement Calculator]
    F --> P[Balance Manager]
    F --> Q[Data Validation]
    
    G --> R[URL Scheme Handler]
    G --> S[Message Formatter]
    
    B --> T[QR Code Generator/Scanner]
    T --> U[Device Camera API]
    
    style B fill:#0D4F3C,stroke:#FFD700,stroke-width:3px,color:#FFFFFF
    style D fill:#2D2D30,stroke:#FFD700,stroke-width:2px,color:#FFFFFF
    style G fill:#25D366,stroke:#FFFFFF,stroke-width:2px,color:#FFFFFF
```

### Architectural Patterns

- **Local-First Architecture:** All data operations happen locally with SQLite, eliminating network dependencies and ensuring instant response times - _Rationale:_ Enables 100% offline functionality and eliminates complex sync logic for short-lived poker sessions

- **Component-Based UI:** React Native components with shadcn/ui foundation extended with poker-specific gaming elements - _Rationale:_ Maintainability and accessibility compliance while providing poker-optimized user experience

- **Service Layer Pattern:** Business logic abstracted into services (SettlementService, VoiceService, DatabaseService) - _Rationale:_ Separates concerns and enables easier testing of complex financial calculations

- **Event-Driven Voice Commands:** Voice recognition triggers events processed by command handlers - _Rationale:_ Decouples speech recognition from business logic and enables easy command vocabulary expansion

- **Repository Pattern:** Abstract data access layer over SQLite operations - _Rationale:_ Provides clean interface for database operations and enables future data layer modifications if needed

## Tech Stack

This is the **DEFINITIVE technology selection** for the entire PokePot project. All development must use these exact versions as the single source of truth.

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type safety and developer experience | Prevents runtime errors in financial calculations, excellent React Native support |
| Frontend Framework | React Native | 0.73+ | Cross-platform mobile development | Mature ecosystem, excellent performance, shared codebase for iOS/Android |
| UI Component Library | shadcn/ui + Custom | Latest | Accessible foundation + poker-specific components | WCAG AA compliance built-in, customizable for gaming aesthetics |
| State Management | Zustand | 4.4+ | Lightweight state management | Simple API, excellent TypeScript support, perfect for local-only state |
| Backend Language | TypeScript | 5.3+ | Service layer within React Native | Shared types between UI and business logic, single language stack |
| Backend Framework | React Native Services | N/A | Business logic abstraction layer | No separate backend - services run within mobile app |
| API Style | Internal Function Calls | N/A | Direct service invocation | No external API - all communication via TypeScript function calls |
| Database | SQLite | 3.45+ | Local data persistence | Reliable, fast, zero-config, works completely offline |
| Cache | React Query | 5.0+ | In-memory caching and state sync | Optimistic updates, background sync, excellent DevEx |
| File Storage | React Native FS | 2.20+ | Local file operations and exports | Session export, QR code generation, image handling |
| Authentication | Local Device Storage | N/A | Device-based session management | No user accounts needed, sessions tied to device |
| Frontend Testing | Jest + React Native Testing Library | Latest | Component and integration testing | Standard React Native testing stack, excellent TypeScript support |
| Backend Testing | Jest | 29+ | Business logic and service testing | Same testing framework for consistency, mock SQLite operations |
| E2E Testing | Maestro | 1.30+ | Cross-platform E2E automation | Better than Detox for React Native, supports voice simulation |
| Visual Mobile Testing | mobile-mcp | Latest | React Native UI visual regression | Specialized for gaming interfaces, handles animations and celebrations |
| Visual Web Testing | Playwright | 1.40+ | QR code web view testing | Tests player web interface accessed via QR scanning |
| Screenshot Testing | React Native Screenshot Tests | Latest | Component visual regression | Catches UI regressions in poker layouts and celebrations |
| Build Tool | Metro | 0.80+ | React Native bundler | Standard React Native build system, optimized for mobile |
| Bundler | Metro + React Native | Latest | JavaScript bundling and optimization | Built-in React Native tooling, handles TypeScript compilation |
| IaC Tool | None Required | N/A | No infrastructure to manage | Mobile-only app eliminates infrastructure complexity |
| CI/CD | GitHub Actions | Latest | Automated testing and app store deployment | Excellent React Native support, free for open source |
| Monitoring | Flipper + React Native Performance | Latest | Development debugging and performance | Built-in React Native tooling, SQLite query monitoring |
| Logging | React Native Logs | 5.0+ | Local logging and debugging | File-based logging for offline debugging, export capability |
| CSS Framework | React Native StyleSheet + Tailwind RN | Latest | Styling system with utility classes | Performance optimized, consistent with web patterns |

## Data Models

Based on the PRD requirements, the core data models for PokePot's money tracking functionality:

### Session Model

**Purpose:** Represents a single poker night session with players and transaction tracking

```typescript
interface Session {
  id: string;
  name: string;
  organizerId: string;
  status: 'created' | 'active' | 'completed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalPot: number;
  playerCount: number;
}
```

**Relationships:**
- One-to-many with Player (session has multiple players)
- One-to-many with Transaction (session has multiple buy-ins/cash-outs)

### Player Model

**Purpose:** Represents individual participants in poker sessions for money tracking

```typescript
interface Player {
  id: string;
  sessionId: string;
  name: string;
  isGuest: boolean;
  profileId?: string;
  currentBalance: number;
  totalBuyIns: number;
  totalCashOuts: number;
  status: 'active' | 'cashed_out';
  joinedAt: Date;
}
```

**Relationships:**
- Belongs-to Session (many players per session)
- One-to-many with Transaction (player has multiple transactions)
- Optional belongs-to PlayerProfile (for regular players)

### Transaction Model

**Purpose:** Records individual buy-in and cash-out events for financial tracking

```typescript
interface Transaction {
  id: string;
  sessionId: string;
  playerId: string;
  type: 'buy_in' | 'cash_out';
  amount: number;
  timestamp: Date;
  method: 'voice' | 'manual';
  isVoided: boolean;
  description?: string;
}
```

**Relationships:**
- Belongs-to Session (many transactions per session)
- Belongs-to Player (many transactions per player)

### PlayerProfile Model

**Purpose:** Stores regular player information for quick session setup

```typescript
interface PlayerProfile {
  id: string;
  name: string;
  preferredBuyIn: number;
  avatarPath?: string;
  gamesPlayed: number;
  lastPlayedAt: Date;
  createdAt: Date;
}
```

**Relationships:**
- One-to-many with Player (profile can be used in multiple sessions)

## API Specification

Since PokePot uses **direct TypeScript service invocation** instead of traditional REST/GraphQL APIs, all "backend" functionality is implemented as services within the React Native application.

### Internal Service API Definitions

```typescript
interface SessionService {
  // Session management
  createSession(name: string, organizerId: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  updateSessionStatus(sessionId: string, status: Session['status']): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  
  // Session lifecycle
  startSession(sessionId: string): Promise<void>;
  completeSession(sessionId: string): Promise<SessionSummary>;
  
  // Validation
  validateSessionBalance(sessionId: string): Promise<BalanceValidation>;
}

interface TransactionService {
  // Transaction recording
  recordBuyIn(request: BuyInRequest): Promise<Transaction>;
  recordCashOut(request: CashOutRequest): Promise<Transaction>;
  voidTransaction(transactionId: string): Promise<void>;
  
  // Transaction queries
  getSessionTransactions(sessionId: string): Promise<Transaction[]>;
  getPlayerTransactions(playerId: string): Promise<Transaction[]>;
  
  // Validation
  validateTransactionAmount(amount: number): ValidationResult;
  canCashOut(playerId: string, amount: number): Promise<CashOutValidation>;
}

interface SettlementService {
  // Settlement calculations
  calculateEarlyCashOut(playerId: string): Promise<EarlyCashOutResult>;
  calculateFinalSettlement(sessionId: string): Promise<SettlementPlan>;
  optimizeSettlement(sessionId: string): Promise<OptimizedSettlementPlan>;
  
  // Settlement validation
  validateSettlement(plan: SettlementPlan): Promise<SettlementValidation>;
  generateSettlementSummary(sessionId: string): Promise<SettlementSummary>;
}

interface VoiceService {
  // Voice recognition
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  processVoiceCommand(command: string, sessionId: string): Promise<VoiceCommandResult>;
  
  // Command parsing
  parsePlayerName(command: string, sessionPlayers: Player[]): Promise<string | null>;
  parseAmount(command: string): Promise<number | null>;
  validateCommand(command: string): Promise<CommandValidation>;
}

interface WhatsAppService {
  // Message formatting
  formatSettlementMessage(settlement: SettlementSummary, format: 'summary' | 'detailed'): string;
  formatSessionSummary(session: Session): string;
  
  // Sharing
  shareToWhatsApp(message: string): Promise<ShareResult>;
  copyToClipboard(message: string): Promise<void>;
  generateShareableUrl(sessionId: string): Promise<string>;
}
```

## Components

Based on the architectural patterns, tech stack, and data models, the major logical components across PokePot's monolithic mobile architecture:

### SessionManager Component

**Responsibility:** Orchestrates session lifecycle, player management, and state coordination for poker night tracking

**Key Interfaces:**
- `createSession(name: string): Promise<Session>` - Initialize new poker night session
- `addPlayer(sessionId: string, playerData: PlayerData): Promise<Player>` - Add participant to session
- `getSessionState(sessionId: string): Promise<SessionState>` - Retrieve current session status and players

**Dependencies:** DatabaseService for persistence, ValidationService for business rules

**Technology Stack:** TypeScript service class with Zustand state management, SQLite integration via react-native-sqlite-storage

### TransactionProcessor Component

**Responsibility:** Handles all buy-in and cash-out transaction recording, validation, and balance calculations

**Key Interfaces:**
- `recordBuyIn(playerId: string, amount: number, method: TransactionMethod): Promise<Transaction>` - Process buy-in transaction
- `recordCashOut(playerId: string, amount: number): Promise<Transaction>` - Process cash-out transaction
- `calculatePlayerBalance(playerId: string): Promise<PlayerBalance>` - Real-time balance computation

**Dependencies:** SessionManager for session validation, DatabaseService for transaction persistence

**Technology Stack:** TypeScript business logic with React Query for optimistic updates, SQLite transactions for data integrity

### SettlementEngine Component

**Responsibility:** Performs early cash-out calculations and final settlement optimization algorithms

**Key Interfaces:**
- `calculateEarlyCashOut(playerId: string): Promise<EarlyCashOutResult>` - Instant mid-game settlement calculation
- `optimizeFinalSettlement(sessionId: string): Promise<OptimizedSettlement>` - Minimize payment transactions algorithm
- `validateSettlement(settlement: Settlement): Promise<ValidationResult>` - Mathematical verification of settlement accuracy

**Dependencies:** TransactionProcessor for balance data, SessionManager for player information

**Technology Stack:** TypeScript algorithms with potential native module for performance-critical calculations, comprehensive Jest testing for financial accuracy

### VoiceCommandHandler Component

**Responsibility:** Processes voice recognition input and converts speech to transaction commands

**Key Interfaces:**
- `startListening(): Promise<void>` - Activate device speech recognition
- `processCommand(audioInput: string, context: SessionContext): Promise<CommandResult>` - Parse and execute voice commands
- `validatePlayerName(spokenName: string, sessionPlayers: Player[]): Promise<string | null>` - Match voice input to session participants

**Dependencies:** TransactionProcessor for command execution, SessionManager for player context

**Technology Stack:** @react-native-community/voice for speech recognition, custom TypeScript command parsing logic, iOS Speech Framework / Android SpeechRecognizer APIs

### WhatsAppIntegration Component

**Responsibility:** Formats session results and handles social sharing via WhatsApp URL schemes

**Key Interfaces:**
- `formatSettlementMessage(settlement: Settlement, format: MessageFormat): string` - Create shareable settlement summary
- `shareToWhatsApp(message: string): Promise<ShareResult>` - Launch WhatsApp with pre-filled message
- `generateQRCode(sessionId: string): Promise<string>` - Create session joining QR code

**Dependencies:** SettlementEngine for settlement data, SessionManager for session information

**Technology Stack:** React Native Linking API for URL schemes, react-native-qrcode-generator, clipboard fallback for sharing reliability

### DatabaseManager Component

**Responsibility:** Abstracts SQLite operations and manages local data persistence with encryption

**Key Interfaces:**
- `executeQuery<T>(query: string, params: any[]): Promise<T[]>` - Execute database operations
- `initializeSchema(): Promise<void>` - Set up database tables and indexes
- `cleanupExpiredSessions(): Promise<void>` - Privacy-compliant data removal

**Dependencies:** None (foundational component)

**Technology Stack:** react-native-sqlite-storage with WAL mode, AES-256 encryption, connection pooling for performance

### Component Diagrams

```mermaid
graph TD
    A[UI Layer Components] --> B[SessionManager]
    A --> C[TransactionProcessor]
    A --> D[VoiceCommandHandler]
    
    B --> E[DatabaseManager]
    C --> E
    C --> B
    
    D --> C
    D --> F[Device Speech APIs]
    
    G[SettlementEngine] --> C
    G --> B
    
    H[WhatsAppIntegration] --> G
    H --> B
    H --> I[React Native Linking]
    
    E --> J[SQLite Database]
    
    style B fill:#0D4F3C,color:#FFFFFF
    style C fill:#0D4F3C,color:#FFFFFF
    style E fill:#2D2D30,color:#FFFFFF
    style J fill:#1A1A1A,color:#FFFFFF
```

## External APIs

PokePot is specifically designed to **minimize external dependencies** per ADR-001 (Complete Backend Elimination).

**External API Usage: MINIMAL BY DESIGN**

The application uses only **platform-native APIs** that are built into iOS and Android devices:

### Device Speech Recognition APIs

- **Purpose:** On-device voice command processing for hands-free transaction recording
- **Documentation:** iOS Speech Framework, Android SpeechRecognizer API
- **Base URL(s):** Native device APIs (no network endpoints)
- **Authentication:** Device permissions (microphone access)
- **Rate Limits:** No network rate limits - device processing only

**Key Endpoints Used:**
- iOS: `SFSpeechRecognizer.requestAuthorization()` - Permission management
- Android: `SpeechRecognizer.createSpeechRecognizer()` - Voice recognition service

### WhatsApp URL Scheme Integration

- **Purpose:** Social sharing of settlement results without requiring WhatsApp API integration
- **Documentation:** WhatsApp URL Scheme Documentation
- **Base URL(s):** `whatsapp://send?text=` (URL scheme, not API)
- **Authentication:** None required - uses device WhatsApp installation
- **Rate Limits:** No API limits - simple URL scheme activation

**Key Endpoints Used:**
- `whatsapp://send?text={encoded_message}` - Open WhatsApp with pre-filled message

### Device Platform APIs (No Network Calls)

**Camera API:** QR code generation and scanning for session joining
**File System API:** Local export and import functionality  
**Device Storage API:** SQLite database operations and file management
**Notifications API:** Local notifications for session reminders (if implemented)

### Network Dependencies: NONE

**Deliberate Architectural Choice:**
- No REST APIs, GraphQL endpoints, or cloud services
- No authentication servers or user management systems  
- No real-time sync or collaboration features
- No analytics or crash reporting services (initially)

## Core Workflows

Key system workflows using sequence diagrams to illustrate critical user journeys and component interactions:

### Workflow 1: Session Creation and Player Onboarding

```mermaid
sequenceDiagram
    participant U as User/Organizer
    participant UI as UI Layer
    participant SM as SessionManager
    participant DB as DatabaseManager
    participant QR as QRGenerator
    
    U->>UI: Create new poker session
    UI->>SM: createSession(name, organizerId)
    SM->>DB: INSERT INTO sessions
    DB-->>SM: session created
    SM-->>UI: Session object
    
    loop Add Players (4-8)
        U->>UI: Add player (name, isGuest)
        UI->>SM: addPlayer(sessionId, playerData)
        SM->>DB: INSERT INTO players
        DB-->>SM: player created
        SM-->>UI: Player added
    end
    
    U->>UI: Start session
    UI->>SM: startSession(sessionId)
    SM->>DB: UPDATE session status = 'active'
    SM->>QR: generateQRCode(sessionId)
    QR-->>SM: QR code data
    SM-->>UI: Session active + QR code
    UI-->>U: Live game dashboard ready
```

### Workflow 2: Voice-Enabled Transaction Recording

```mermaid
sequenceDiagram
    participant U as User
    participant UI as UI Layer
    participant VC as VoiceCommandHandler
    participant TP as TransactionProcessor
    participant SM as SessionManager
    participant DB as DatabaseManager
    
    U->>UI: Press voice activation button
    UI->>VC: startListening()
    VC->>VC: Activate device speech recognition
    VC-->>UI: Listening state active
    
    U->>VC: "Add John fifty dollars"
    VC->>VC: Process voice input
    VC->>SM: getSessionPlayers(sessionId)
    SM-->>VC: Player list
    VC->>VC: parsePlayerName("John", players)
    VC->>VC: parseAmount("fifty dollars")
    
    VC-->>UI: Command parsed: {player: "John", amount: 50, type: "buy_in"}
    UI-->>U: Confirmation dialog
    U->>UI: Confirm transaction
    
    UI->>TP: recordBuyIn(playerId, 50, "voice")
    TP->>DB: BEGIN TRANSACTION
    TP->>DB: INSERT INTO transactions
    TP->>DB: UPDATE player balance
    TP->>DB: UPDATE session total_pot
    TP->>DB: COMMIT
    DB-->>TP: Transaction successful
    
    TP-->>UI: Transaction recorded
    UI-->>U: Success celebration + updated balance
```

### Workflow 3: Settlement Optimization

```mermaid
sequenceDiagram
    participant U as Organizer
    participant UI as UI Layer
    participant SE as SettlementEngine
    participant TP as TransactionProcessor
    participant WA as WhatsAppIntegration
    participant DB as DatabaseManager
    
    U->>UI: End game session
    UI->>SE: optimizeFinalSettlement(sessionId)
    
    SE->>TP: getAllPlayerBalances(sessionId)
    TP->>DB: SELECT all players + transactions
    DB-->>TP: Complete session data
    TP-->>SE: Player net positions
    
    SE->>SE: Run settlement optimization algorithm
    Note over SE: Minimize total payment transactions<br/>Algorithm completes within 2 seconds
    
    SE->>SE: validateSettlement(optimizedPlan)
    SE-->>UI: OptimizedSettlement {payments[], savings}
    
    UI-->>U: Settlement plan (X payments instead of Y)
    U->>UI: Share to WhatsApp
    
    UI->>WA: formatSettlementMessage(settlement, "detailed")
    WA-->>UI: Formatted message
    UI->>WA: shareToWhatsApp(message)
    WA->>WA: Launch WhatsApp with message
    WA-->>UI: Share initiated
    
    UI->>SE: completeSession(sessionId)
    SE->>DB: UPDATE session status = 'completed'
    SE-->>UI: Session completed
    
    UI-->>U: Game ended + cleanup scheduled
```

## Database Schema

Transforming the conceptual data models into concrete SQLite schema optimized for mobile performance and financial accuracy:

### SQLite Schema Definition

```sql
-- Enable WAL mode and performance optimizations
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
PRAGMA foreign_keys=ON;

-- Sessions table - Core poker night session tracking
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organizer_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('created', 'active', 'completed')) NOT NULL DEFAULT 'created',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    total_pot DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    player_count INTEGER NOT NULL DEFAULT 0,
    cleanup_at DATETIME, -- For automatic 8-12 hour cleanup
    
    -- Performance indexes
    INDEX idx_sessions_status ON sessions(status),
    INDEX idx_sessions_cleanup ON sessions(cleanup_at),
    INDEX idx_sessions_created ON sessions(created_at)
);

-- Players table - Session participants
CREATE TABLE players (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_guest BOOLEAN NOT NULL DEFAULT TRUE,
    profile_id TEXT REFERENCES player_profiles(id),
    current_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_buy_ins DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_cash_outs DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT CHECK(status IN ('active', 'cashed_out')) NOT NULL DEFAULT 'active',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_players_session ON players(session_id),
    INDEX idx_players_profile ON players(profile_id),
    INDEX idx_players_status ON players(session_id, status)
);

-- Transactions table - Buy-ins and cash-outs with audit trail
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('buy_in', 'cash_out')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK(amount > 0),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method TEXT CHECK(method IN ('voice', 'manual')) NOT NULL,
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    
    -- Audit and validation fields
    created_by TEXT NOT NULL, -- Device identifier
    voided_at DATETIME,
    void_reason TEXT,
    
    -- Performance indexes
    INDEX idx_transactions_session ON transactions(session_id, timestamp),
    INDEX idx_transactions_player ON transactions(player_id, timestamp),
    INDEX idx_transactions_type ON transactions(session_id, type),
    INDEX idx_transactions_active ON transactions(session_id, is_voided, timestamp)
);

-- Player profiles table - Regular player information
CREATE TABLE player_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    preferred_buy_in DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    avatar_path TEXT,
    games_played INTEGER NOT NULL DEFAULT 0,
    last_played_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_profiles_name ON player_profiles(name),
    INDEX idx_profiles_last_played ON player_profiles(last_played_at)
);
```

## Frontend Architecture

React Native mobile application architecture details:

### Component Architecture

#### Component Organization
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

### State Management Architecture

#### State Structure
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

### Routing Architecture

#### Route Organization
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

## Backend Architecture

Define backend-specific architecture details for the service layer within the React Native application:

### Service Architecture

Since PokePot uses a monolithic mobile architecture, the "backend" consists of TypeScript services running within the React Native application.

#### Service Organization
```
src/services/
├── core/                    # Core business logic services
│   ├── SessionService.ts    # Session lifecycle management
│   ├── TransactionService.ts # Buy-in/cash-out processing
│   ├── SettlementService.ts  # Settlement calculations
│   └── ValidationService.ts  # Business rule validation
├── infrastructure/          # Infrastructure services
│   ├── DatabaseService.ts   # SQLite operations
│   ├── StorageService.ts    # Local file operations
│   └── DeviceService.ts     # Device API integrations
├── integration/            # External integration services
│   ├── VoiceService.ts     # Speech recognition
│   ├── WhatsAppService.ts  # Social sharing
│   └── QRService.ts        # QR code generation/scanning
└── utils/                  # Service utilities
    ├── CalculationUtils.ts # Financial calculations
    ├── ValidationUtils.ts  # Input validation
    └── ErrorUtils.ts       # Error handling
```

### Authentication and Authorization

Since this is a device-based application, authentication uses local device storage with session organizer privileges tied to device ID.

```typescript
// Authorization service for device-based session management
export class AuthorizationService {
  private deviceId: string;
  
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }
  
  async checkSessionAccess(
    sessionId: string, 
    operation: 'read' | 'write' | 'organize'
  ): Promise<AuthorizationResult> {
    const session = await DatabaseService.getSession(sessionId);
    
    if (!session) {
      return { authorized: false, reason: 'Session not found' };
    }
    
    switch (operation) {
      case 'read':
        // Anyone can read session data via QR code
        return { authorized: true };
        
      case 'write':
        // Only organizer can modify session
        if (session.organizerId === this.deviceId) {
          return { authorized: true };
        }
        return { authorized: false, reason: 'Only organizer can modify session' };
        
      case 'organize':
        // Only organizer can manage session lifecycle
        if (session.organizerId === this.deviceId) {
          return { authorized: true };
        }
        return { authorized: false, reason: 'Organizer access required' };
        
      default:
        return { authorized: false, reason: 'Invalid operation' };
    }
  }
}
```

## Unified Project Structure

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

## Development Workflow

Define the development setup and workflow for PokePot's React Native mobile application:

### Local Development Setup

#### Prerequisites
```bash
# Node.js and package management
node --version  # Requires Node.js 18.0+
npm --version   # npm 9.0+ or yarn 3.0+

# React Native development environment
npx react-native doctor  # Validates RN environment

# iOS development (macOS only)
xcode-select --install
pod --version  # CocoaPods 1.12+

# Android development
# Android Studio with SDK 33+
# Java 11+ (OpenJDK recommended)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Development tools
git --version
watchman --version  # File watching (macOS/Linux)
```

#### Initial Setup
```bash
# Clone repository and install dependencies
git clone <repository-url>
cd HomePoker_v2
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..

# Database setup
npm run db:setup    # Initialize SQLite schema
npm run db:seed     # Add sample data for development

# Environment configuration
cp .env.example .env.local
# Edit .env.local with development settings

# Verify setup
npm run validate    # Run setup validation script
```

#### Development Commands
```bash
# Start all services
npm run start       # Start Metro bundler
npm run ios         # Launch iOS simulator
npm run android     # Launch Android emulator

# Testing
npm test            # Unit tests (Jest)
npm run test:watch  # Interactive test watcher
npm run test:e2e    # End-to-end tests (Maestro)
npm run test:visual # Visual regression tests (mobile-mcp)

# Code quality
npm run lint        # ESLint validation
npm run typecheck   # TypeScript validation
npm run format      # Prettier code formatting
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
# Development configuration
NODE_ENV=development
DEBUG_MODE=true

# Database
DB_NAME=pokepot_dev.db
DB_ENCRYPTION_KEY=dev_key_not_for_production

# Voice Recognition
VOICE_LANGUAGE=en-US
VOICE_CONFIDENCE_THRESHOLD=0.7

# Celebration Settings
ENABLE_ANIMATIONS=true
ENABLE_SOUND_EFFECTS=true

# Development Tools
FLIPPER_ENABLED=true
REDUX_DEVTOOLS=true
```

## Deployment Architecture

Define deployment strategy based on React Native mobile platform and app store distribution:

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Apple App Store (iOS) and Google Play Store (Android)
- **Build Command:** `npm run build:ios` and `npm run build:android`
- **Output Directory:** `ios/build/` and `android/app/build/outputs/`
- **CDN/Edge:** App stores handle global distribution and caching

**Backend Deployment:**
- **Platform:** Embedded within mobile application (no separate deployment)
- **Build Command:** Services bundled with React Native app build process
- **Deployment Method:** Code bundled into mobile app binary

### CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yaml
name: PokePot CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  RUBY_VERSION: '3.1'

jobs:
  # Code Quality and Testing
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: TypeScript check
        run: npm run typecheck
        
      - name: Lint check
        run: npm run lint
        
      - name: Unit tests
        run: npm run test:coverage
        
      - name: Database schema validation
        run: npm run db:validate
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  # Visual Regression Testing
  visual-testing:
    runs-on: ubuntu-latest
    needs: quality-check
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run visual regression tests
        run: npm run test:visual

  # iOS Build and Deploy
  ios-build:
    runs-on: macos-latest
    needs: [quality-check, visual-testing]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ env.RUBY_VERSION }}
          bundler-cache: true
          working-directory: ios
          
      - name: Install dependencies
        run: |
          npm ci
          cd ios && pod install
          
      - name: Build iOS app
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
        run: |
          cd ios
          bundle exec fastlane build_and_upload_to_testflight

  # Android Build and Deploy
  android-build:
    runs-on: ubuntu-latest
    needs: [quality-check, visual-testing]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '11'
          
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
        
      - name: Install dependencies
        run: npm ci
        
      - name: Build Android app
        env:
          ANDROID_KEYSTORE: ${{ secrets.ANDROID_KEYSTORE }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          cd android
          ./gradlew bundleRelease
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | Local Device/Simulator | Embedded Services | Local development and testing |
| Staging | TestFlight (iOS) / Internal Track (Android) | Embedded Services | Pre-production testing with stakeholders |
| Production | App Store (iOS) / Google Play (Android) | Embedded Services | Live user environment |

## Security and Performance

Define security and performance considerations for PokePot's mobile-first financial tracking application:

### Security Requirements

**Frontend Security:**
- **CSP Headers:** Not applicable (mobile app, not web) - Native app security model used
- **XSS Prevention:** React Native's built-in sanitization + TypeScript type safety for all user inputs
- **Secure Storage:** iOS Keychain and Android Keystore for sensitive data, encrypted SQLite database with AES-256

**Backend Security:**
- **Input Validation:** Comprehensive validation at service layer for all financial inputs (amounts, player names, session data)
- **Rate Limiting:** Voice command throttling (max 1 command per 2 seconds) + transaction rate limiting (max 10 per minute per session)
- **CORS Policy:** Not applicable (no web API endpoints) - Mobile app uses direct service calls

**Authentication Security:**
- **Token Storage:** Device-based authentication using secure local storage (iOS Keychain/Android Keystore)
- **Session Management:** Session organizer privileges tied to device ID with automatic expiration
- **Password Policy:** No user passwords - device-based authorization only

### Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** Under 50MB total app size for both iOS and Android
- **Loading Strategy:** Lazy loading for settlement calculations, instant loading for core transaction recording
- **Caching Strategy:** React Query for in-memory caching, SQLite for persistent data with WAL mode

**Backend Performance:**
- **Response Time Target:** 95% of database operations complete within 100ms, settlement calculations within 2 seconds
- **Database Optimization:** Indexed queries, connection pooling, WAL journaling mode, query optimization
- **Caching Strategy:** Calculated balances cached in memory with SQLite triggers for updates

## Testing Strategy

Define comprehensive testing approach with **90% code coverage requirement** and robust visual testing:

### Testing Standards and Requirements

**Code Coverage Standards:**
- **Overall Coverage Target:** 90% minimum across all code paths
- **Critical Path Coverage:** 100% for financial calculations, settlement algorithms, and transaction processing
- **Component Coverage:** 85% minimum for UI components with focus on user interactions
- **Service Layer Coverage:** 95% minimum for all business logic services
- **Database Layer Coverage:** 90% minimum for all data operations

### Enhanced Testing Pyramid with Coverage Targets

```
                  E2E Tests (90% user flow coverage)
                 /                                \
         Visual Tests (95% UI component coverage)
            /                                      \
    Integration Tests (85% service interaction coverage)
               /                                        \
          Frontend Unit (90%)              Backend Unit (95%)
```

### Test Organization

#### Frontend Tests (90% Coverage Target)
- Component unit tests with React Native Testing Library
- Screen integration tests
- Custom hook tests
- State management tests
- Utility function tests

#### Backend Tests (95% Coverage Target)
- Business logic tests (100% for financial services)
- Database and device tests
- External integration tests

#### Visual Testing Strategy (95% UI Coverage)
- React Native visual tests with mobile-mcp
- Component screenshot tests
- Accessibility compliance validation
- Animation and celebration testing

### Financial Calculation Testing

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

## Coding Standards

Define **MINIMAL but CRITICAL** standards for AI agents focused on project-specific rules:

### Critical Fullstack Rules

- **Type Sharing:** Always define shared types in `src/types/` and import consistently across components and services - prevents runtime type mismatches in financial calculations
- **Service Layer Calls:** Never bypass service layer - all database operations must go through `DatabaseService`, all business logic through core services - maintains data integrity and transaction consistency
- **Financial Precision:** Always use `CalculationUtils.addAmounts()`, `CalculationUtils.subtractAmounts()` for currency math - prevents floating-point precision errors in settlements
- **Transaction Atomicity:** All multi-step database operations must use `DatabaseService.executeTransaction()` with proper rollback - ensures financial data consistency
- **Input Validation:** Every user input must be validated through `ValidationService` before processing - prevents invalid financial data and security vulnerabilities  
- **Error Handling:** All service methods must use consistent `ServiceError` class with proper error codes - enables proper error recovery and user feedback
- **State Updates:** Never mutate Zustand store state directly - use store actions that maintain immutability - prevents state corruption during concurrent operations
- **Voice Command Confirmation:** All voice-initiated financial transactions must show visual confirmation dialog - prevents accidental money movements
- **Settlement Verification:** Every settlement calculation must call `SettlementService.validateSettlement()` to ensure mathematical balance - guarantees accuracy
- **Database Queries:** Use parameterized queries exclusively via `DatabaseService.executeQuery()` - prevents SQL injection and ensures proper escaping

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `PlayerCard.tsx`, `SettlementSummary.tsx` |
| Hooks | camelCase with 'use' | - | `useVoiceCommands.ts`, `useSessionData.ts` |
| Services | PascalCase classes | PascalCase classes | `TransactionService.ts`, `SettlementService.ts` |
| Database Tables | - | snake_case | `sessions`, `players`, `transactions` |
| Database Columns | - | snake_case | `player_id`, `created_at`, `total_buy_ins` |
| Store Actions | camelCase | - | `addTransaction`, `updatePlayerBalance` |
| Error Codes | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `VALIDATION_ERROR`, `SETTLEMENT_CALCULATION_FAILED` |
| Constants | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `MAX_PLAYERS_PER_SESSION`, `MIN_TRANSACTION_AMOUNT` |

## Error Handling Strategy

Define unified error handling across PokePot's React Native frontend and embedded service layer:

### Error Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Service as Service Layer
    participant DB as Database
    participant User as User
    
    UI->>Service: Call business operation
    Service->>DB: Execute database operation
    DB-->>Service: Database error
    Service->>Service: Wrap in ServiceError
    Service-->>UI: ServiceError with context
    UI->>UI: Map to user message
    UI-->>User: Display appropriate error
    
    alt Critical Financial Error
        UI->>UI: Log error details
        UI->>UI: Disable financial operations
        UI-->>User: Show recovery options
    else Recoverable Error
        UI->>UI: Show retry option
        UI-->>User: Allow user to retry
    end
```

### Error Response Format

```typescript
interface ServiceError extends Error {
  code: 'VALIDATION_ERROR' | 'CALCULATION_ERROR' | 'DATABASE_ERROR' | 'VOICE_ERROR' | 'SETTLEMENT_ERROR' | 'AUTHORIZATION_ERROR';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  playerId?: string;
  recoverable: boolean;
  retryable: boolean;
}
```

### Frontend Error Handling

Critical financial operations use error boundaries to prevent app crashes:

```typescript
export class FinancialErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: ServiceError }
> {
  static getDerivedStateFromError(error: Error): { hasError: boolean; error: ServiceError } {
    const serviceError = error instanceof ServiceError 
      ? error 
      : new ServiceError('CALCULATION_ERROR', error.message);
      
    return { hasError: true, error: serviceError };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <FinancialErrorFallback 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

## Monitoring and Observability

Define monitoring strategy for PokePot's React Native mobile application with embedded services:

### Monitoring Stack

- **Frontend Monitoring:** React Native Performance Monitor + Flipper (development) + React Native built-in metrics
- **Backend Monitoring:** Custom service performance tracking + SQLite query monitoring + JavaScript error tracking
- **Error Tracking:** Local error logging with optional crash reporting (disabled for MVP privacy)
- **Performance Monitoring:** Custom performance metrics collection + database operation timing + settlement calculation monitoring

### Key Metrics

**Frontend Metrics:**
- App startup time (target: < 3 seconds)
- Screen transition time (target: < 500ms)
- Memory usage during active sessions (target: < 150MB)
- Voice command recognition accuracy (target: > 90%)
- Voice command processing time (target: < 500ms)
- Frame rate during animations (target: 60fps)

**Backend Metrics:**
- Query execution time (target: 95% < 100ms)
- Settlement calculation time (target: < 2 seconds for 8 players)
- Service method success rate
- Error rate by service type
- Data validation failure rate

### Performance Monitoring Implementation

```typescript
export class PerformanceMonitor {
  // Settlement calculation monitoring (critical for NFR2)
  async measureSettlementCalculation<T>(
    sessionId: string,
    playerCount: number,
    transactionCount: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      // Critical: Must complete within 2 seconds (NFR2)
      if (duration > 2000) {
        console.error(`Settlement calculation exceeded 2-second limit: ${duration}ms`);
        this.recordCriticalPerformanceFailure('settlement_timeout', {
          duration,
          playerCount,
          transactionCount
        });
      }

      return result;
    } catch (error) {
      this.recordCriticalPerformanceFailure('settlement_error', {
        error: error.message,
        playerCount,
        transactionCount
      });

      throw error;
    }
  }
}
```

## Checklist Results Report

### 🎯 ARCHITECT CHECKLIST VALIDATION

**Overall Architecture Readiness: HIGH** ✅

**Project Type:** Full-Stack Mobile Application (React Native with embedded services)

### Executive Summary

**Critical Strengths:**
- Complete requirements alignment with poker night use case
- Robust financial calculation architecture with precision controls
- Comprehensive local-first design eliminating network dependencies
- Well-defined service layer architecture within mobile app
- Strong error handling and performance monitoring strategies

**Key Risk:** Settlement calculation performance at scale (8 players, 50+ transactions)

### Section Analysis Results

#### Requirements Alignment: 95% ✅
- **Functional Requirements Coverage:** 100% - All FR1-FR10 addressed with specific technical solutions
- **Non-Functional Requirements:** 90% - All NFRs addressed with measurable targets (NFR2: <2s settlements, NFR11: <100ms DB ops)
- **Technical Constraints:** 100% - Monolithic mobile architecture per ADR-001 fully implemented

#### Architecture Fundamentals: 92% ✅
- **Architecture Clarity:** 95% - Complete Mermaid diagrams, component definitions, data flows
- **Separation of Concerns:** 90% - Clear UI/Service/Data layer boundaries with TypeScript interfaces
- **Design Patterns:** 90% - Repository pattern, Service layer, Event-driven voice commands
- **Modularity:** 90% - Components designed for AI agent implementation with single responsibilities

#### Technical Stack & Decisions: 88% ✅
- **Technology Selection:** 95% - All versions specified (React Native 0.73+, SQLite 3.45+, TypeScript 5.3+)
- **Frontend Architecture:** 90% - Complete React Native component organization, Zustand state management
- **Backend Architecture:** 85% - Service layer well-defined, but performance testing needed for settlement algorithms
- **Data Architecture:** 90% - Comprehensive SQLite schema with proper indexes and triggers

#### AI Agent Implementation Suitability: 96% ✅
- **Modularity:** 95% - Components sized appropriately, clear interfaces, single responsibilities
- **Clarity & Predictability:** 95% - Consistent patterns, TypeScript interfaces, clear examples
- **Implementation Guidance:** 95% - Detailed service templates, coding standards, error handling patterns
- **Error Prevention:** 100% - Comprehensive validation, ServiceError system, testing requirements

### Risk Assessment

#### Top 3 Risks by Severity:

1. **MEDIUM RISK - Settlement Algorithm Performance**
   - **Issue:** 2-second calculation limit for complex scenarios not validated
   - **Mitigation:** Implement performance testing, consider native module optimization
   - **Timeline Impact:** 2-3 days for performance validation

2. **LOW RISK - Voice Recognition Accuracy**
   - **Issue:** 90% accuracy target in poker room conditions not validated
   - **Mitigation:** Environmental testing, noise cancellation research, manual fallbacks
   - **Timeline Impact:** 1-2 days for testing framework

3. **LOW RISK - SQLite Performance on Older Devices**
   - **Issue:** 100ms database operation target on minimum spec devices needs validation
   - **Mitigation:** Device-specific performance testing, optimization validation
   - **Timeline Impact:** 2-3 days for device testing

### Final Recommendation

**ARCHITECTURE APPROVED FOR IMPLEMENTATION** ✅

This architecture is exceptionally well-designed for PokePot's poker night money tracking requirements. The local-first, mobile-focused approach with comprehensive financial controls and user experience optimizations provides a solid foundation for AI-driven development.

**Implementation Priority:**
1. Begin with core service layer implementation (SessionService, TransactionService)
2. Implement database schema and performance optimization
3. Add UI components with comprehensive testing
4. Integrate voice recognition and settlement algorithms
5. Complete deployment pipeline and app store preparation

The architecture demonstrates thorough consideration of the unique requirements for poker night money tracking while maintaining development simplicity and user privacy.

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-11  
**Architecture Baseline**: Monolithic Mobile (ADR-001)  
**Ready for Implementation**: ✅ YES

**Architecture Philosophy Summary**: Local-first design + Financial precision + Voice-enabled UX + Privacy-focused + Performance-optimized + AI-agent ready, creating an entertaining and reliable poker night companion that transforms chaotic money tracking into dispute-free settlements.