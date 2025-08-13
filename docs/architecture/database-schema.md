# Database Schema

Transforming the conceptual data models into concrete SQLite schema optimized for mobile performance and financial accuracy:

## SQLite Schema Definition

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
    cleanup_at DATETIME, -- For automatic 10 hour cleanup
    exported_at DATETIME, -- When session data was exported
    export_format TEXT, -- Format of export (json, csv, whatsapp)
    warning_sent BOOLEAN NOT NULL DEFAULT FALSE, -- Cleanup warning notification sent
    
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

-- Notification queue table - Deferred notifications for when app is inactive
CREATE TABLE notification_queue (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    actions TEXT, -- JSON serialized action buttons
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shown_at DATETIME, -- When notification was displayed
    dismissed_at DATETIME, -- When user dismissed it
    
    -- Performance indexes
    INDEX idx_notifications_pending ON notification_queue(shown_at),
    INDEX idx_notifications_created ON notification_queue(created_at)
);

-- Scheduled tasks table - Background task persistence
CREATE TABLE scheduled_tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL,
    payload TEXT, -- JSON serialized task data
    execute_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    executed_at DATETIME,
    status TEXT CHECK(status IN ('pending', 'executed', 'failed')) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    
    -- Performance indexes
    INDEX idx_scheduled_tasks_execute ON scheduled_tasks(execute_at, status),
    INDEX idx_scheduled_tasks_type ON scheduled_tasks(task_type, status)
);
```
