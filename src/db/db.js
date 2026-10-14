// Database connection manager for ToolTrack
// Uses Node.js native SQLite (node:sqlite) for zero external build dependencies

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Resolve database storage path under backend/data/tooltrack.db
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'tooltrack.db');

// Initialize SQLite connection
const db = new DatabaseSync(dbPath);

// Enable Foreign Key constraints and Write-Ahead Logging for safety and speed
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Execute a query that returns multiple rows
 * @param {string} sql - SQL query string
 * @param {Array} params - Array of parameter values
 * @returns {Array<Object>}
 */
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params);
  // Return plain objects without null prototype for standard JS handling
  return rows.map(row => ({ ...row }));
}

/**
 * Execute a query that returns a single row
 * @param {string} sql - SQL query string
 * @param {Array} params - Array of parameter values
 * @returns {Object|null}
 */
function get(sql, params = []) {
  const stmt = db.prepare(sql);
  const row = stmt.get(...params);
  return row ? { ...row } : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * @param {string} sql - SQL query string
 * @param {Array} params - Array of parameter values
 * @returns {{ changes: number, lastInsertRowid: number|bigint }}
 */
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute raw multi-statement SQL script (used for migrations and schema setup)
 * @param {string} sqlScript
 */
function exec(sqlScript) {
  return db.exec(sqlScript);
}

module.exports = {
  db,
  query,
  get,
  run,
  exec,
  dbPath,
};
