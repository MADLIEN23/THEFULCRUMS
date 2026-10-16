-- ToolTrack Database Schema
-- Designed for factory and workshop tool lifecycle tracking
-- Enforces referential integrity and immutable event logging

PRAGMA foreign_keys = ON;

-- 1. Users table
-- Stores authorized workshop personnel with role-based access
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Operator', 'Inspector')),
    department TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 2. Tools master table
-- Stores tool specifications, assignment, and initial state
CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    owner TEXT NOT NULL,
    condition TEXT NOT NULL,
    expected_return_date TEXT,
    maintenance_due_date TEXT,
    created_at TEXT NOT NULL
);

-- 3. Status events table
-- Append-only audit history of every action taken on any tool
CREATE TABLE IF NOT EXISTS status_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN (
        'Registered',
        'Received',
        'Inspected',
        'Issued',
        'In Use',
        'Returned',
        'Sent for Maintenance',
        'Repaired',
        'Retired'
    )),
    updated_by TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    photo TEXT,
    maintenance_flag INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
);

-- Indexes for rapid lookups and timeline ordering
CREATE INDEX IF NOT EXISTS idx_status_events_tool_time 
ON status_events(tool_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_tools_department
ON tools(department);

-- 4. Computed view for current tool state
-- Joins tools with their single most recent status event
CREATE VIEW IF NOT EXISTS v_tools_current AS
SELECT 
    t.id,
    t.name,
    t.type,
    t.serial_number,
    t.department,
    t.location AS home_location,
    t.owner,
    t.condition AS initial_condition,
    t.expected_return_date,
    t.maintenance_due_date,
    t.created_at,
    COALESCE(e.status, 'Registered') AS current_status,
    COALESCE(e.location, t.location) AS current_location,
    e.updated_by AS last_updated_by,
    e.timestamp AS last_updated_at,
    e.notes AS last_notes,
    e.photo AS last_photo,
    COALESCE(e.maintenance_flag, 0) AS maintenance_flag,
    e.id AS latest_event_id
FROM tools t
LEFT JOIN status_events e ON e.id = (
    SELECT id 
    FROM status_events 
    WHERE tool_id = t.id 
    ORDER BY timestamp DESC, id DESC 
    LIMIT 1
);
