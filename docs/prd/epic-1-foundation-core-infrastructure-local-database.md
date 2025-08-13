# Epic 1: Foundation & Core Infrastructure (Local Database)

**Expanded Goal:** Establish project setup, local SQLite database foundation, and core money tracking functionality while delivering a functional minimum viable calculator that groups can immediately use for basic poker night tracking. This epic creates the foundational architecture and delivers the first increment of user value through reliable buy-in/cash-out tracking.

## Story 1.1: Project Setup and Development Environment

As a **developer**,
I want **a complete development environment with React Native and local database setup**,
so that **I can begin building PokePot features with proper tooling and deployment pipeline**.

### Acceptance Criteria
1. React Native project created with TypeScript configuration and runs on iOS/Android simulators
2. Local SQLite database connection and testing framework
3. Basic health check functionality returning app status and database connectivity
4. Git repository initialized with proper .gitignore and basic CI/CD pipeline setup
5. Development documentation includes setup instructions for new developers
6. Local environment supports hot reload for frontend development

## Story 1.2: Basic Session Creation and Management

As a **poker game organizer**,
I want **to create a new poker session and add players to track throughout the night**,
so that **I can start organizing money tracking before the game begins**.

### Acceptance Criteria
1. Session creation form accepts session name and organizer information
2. Player addition interface allows adding 4-8 players with names (no accounts required)
3. Session displays current player list with ability to add/remove players before game starts
4. Each session generates unique session ID for later reference
5. Session data persists locally with SQLite storage
6. Basic session status tracking (created, active, completed)

## Story 1.3: Buy-in Transaction Recording

As a **poker player**,
I want **to record when I buy into the game for a specific dollar amount**,
so that **my contribution to the pot is tracked accurately throughout the session**.

### Acceptance Criteria
1. Buy-in entry interface accepts player selection and dollar amount
2. Transaction timestamp automatically recorded with each buy-in
3. Player running total updates immediately after buy-in entry
4. Buy-in history displays all transactions for session with timestamps
5. Input validation prevents negative amounts and enforces reasonable limits ($5-$500)
6. Simple undo functionality for last transaction entered within 30 seconds

## Story 1.4: Cash-out Transaction Recording

As a **poker player**,
I want **to record when I cash out chips for a specific dollar amount**,
so that **my final position and what I owe or am owed is calculated correctly**.

### Acceptance Criteria
1. Cash-out entry interface accepts player selection and dollar amount
2. Transaction timestamp automatically recorded with each cash-out
3. Player running balance updates to show net position (positive/negative)
4. Cash-out cannot exceed total buy-ins unless explicitly confirmed by organizer
5. Session balance validation ensures total cash-outs don't exceed total buy-ins
6. Player status updates to "cashed out" when they leave the game

## Story 1.5: Local Database Foundation (Backend Elimination)

As a **poker session manager**,
I want **all data stored locally on my device**,
so that **I can manage sessions and transactions without any network dependencies**.

### Acceptance Criteria
1. SQLite database integration using react-native-sqlite-storage
2. Complete removal of any API layer dependencies
3. Local database schema creation for sessions, players, transactions
4. Redux store updated to use local storage instead of network calls
5. All existing screens work with local data (no network calls)
6. Database initialization on app startup
7. Error handling for database operations
8. Database migration system for future schema changes

## Story 1.6: WhatsApp Integration with Local Data

As a **poker session manager**,
I want **to export session results directly to WhatsApp groups**,
so that **players can see final tallies and settlement information**.

### Acceptance Criteria
1. WhatsApp message export functionality using local session data
2. Session summary message format (players, buy-ins, cash-outs, settlements)
3. Integration with WhatsApp using URL scheme
4. Export button on session completion screen
5. Local message queue for offline scenarios (send when network available)
6. Error handling for WhatsApp integration failures
7. Multiple export formats (detailed vs summary)

## Story 1.7: Session Lifecycle and Data Cleanup

As a **poker session manager**,
I want **automatic cleanup of old session data**,
so that **my device storage stays clean and privacy is maintained**.

### Acceptance Criteria
1. Automatic session data cleanup after exactly 10 hours from session completion
2. Manual session deletion option
3. Session export functionality before cleanup
4. Cleanup job scheduling and execution
5. Privacy-compliant data disposal
6. Session history for recently completed games
7. Warning notification at 9 hours if session data not yet exported
