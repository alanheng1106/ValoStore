import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'valostore.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    puuid TEXT PRIMARY KEY,
    username TEXT,
    tag TEXT,
    shard TEXT,
    encrypted_tokens TEXT,
    created_at INTEGER,
    expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS store_cache (
    puuid TEXT PRIMARY KEY,
    store_data TEXT,
    fetched_at INTEGER,
    expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS assets_cache (
    key TEXT PRIMARY KEY,
    data TEXT,
    fetched_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS match_cache (
    puuid TEXT,
    match_id TEXT,
    match_data TEXT,
    fetched_at INTEGER,
    PRIMARY KEY (puuid, match_id)
  );
`);

export default db;
