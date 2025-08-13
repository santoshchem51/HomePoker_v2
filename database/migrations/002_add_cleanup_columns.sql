-- Migration 002: Add cleanup and export tracking columns
-- Version: 2
-- Date: 2025-08-12
-- Story: 1.7 - Session Lifecycle and Data Cleanup

-- Add export tracking columns to sessions table if they don't exist
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS exported_at DATETIME;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS export_format TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS warning_sent BOOLEAN NOT NULL DEFAULT 0;

-- Create notification_queue table for deferred notifications
CREATE TABLE IF NOT EXISTS notification_queue (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('cleanup_warning', 'export_reminder', 'session_complete')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_for DATETIME NOT NULL,
    delivered_at DATETIME,
    dismissed_at DATETIME,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_pending ON notification_queue(scheduled_for, delivered_at);
CREATE INDEX IF NOT EXISTS idx_notifications_session ON notification_queue(session_id);

-- Create scheduled_tasks table for background job persistence
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT CHECK(task_type IN ('cleanup_check', 'notification_check', 'export_reminder')) NOT NULL,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    scheduled_for DATETIME NOT NULL,
    executed_at DATETIME,
    status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_pending ON scheduled_tasks(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_tasks_session ON scheduled_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON scheduled_tasks(task_type, status);

-- Create session_exports table to track export history
CREATE TABLE IF NOT EXISTS session_exports (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    export_format TEXT CHECK(export_format IN ('json', 'csv', 'whatsapp')) NOT NULL,
    file_path TEXT,
    exported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    checksum TEXT
);

CREATE INDEX IF NOT EXISTS idx_exports_session ON session_exports(session_id, exported_at);