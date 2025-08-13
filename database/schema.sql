-- PokePot Database Schema
-- SQLite 3.45+ with WAL mode and performance optimizations

-- Enable WAL mode and performance optimizations
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
PRAGMA foreign_keys=ON;

-- Sessions table
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
    cleanup_at DATETIME
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_cleanup ON sessions(cleanup_at);
CREATE INDEX idx_sessions_created ON sessions(created_at);

-- Player profiles table
CREATE TABLE player_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    preferred_buy_in DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    avatar_path TEXT,
    games_played INTEGER NOT NULL DEFAULT 0,
    last_played_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_name ON player_profiles(name);
CREATE INDEX idx_profiles_last_played ON player_profiles(last_played_at);

-- Players table
CREATE TABLE players (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_guest BOOLEAN NOT NULL DEFAULT 1,
    profile_id TEXT REFERENCES player_profiles(id),
    current_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_buy_ins DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_cash_outs DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT CHECK(status IN ('active', 'cashed_out')) NOT NULL DEFAULT 'active',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_session ON players(session_id);
CREATE INDEX idx_players_profile ON players(profile_id);
CREATE INDEX idx_players_status ON players(session_id, status);

-- Transactions table
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('buy_in', 'cash_out')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK(amount > 0),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method TEXT CHECK(method IN ('voice', 'manual')) NOT NULL,
    is_voided BOOLEAN NOT NULL DEFAULT 0,
    description TEXT,
    created_by TEXT NOT NULL,
    voided_at DATETIME,
    void_reason TEXT
);

CREATE INDEX idx_transactions_session ON transactions(session_id, timestamp);
CREATE INDEX idx_transactions_player ON transactions(player_id, timestamp);
CREATE INDEX idx_transactions_type ON transactions(session_id, type);
CREATE INDEX idx_transactions_active ON transactions(session_id, is_voided, timestamp);
