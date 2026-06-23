import db from './db';

// Store Cache
export function getStoreCache(puuid) {
  const stmt = db.prepare('SELECT store_data FROM store_cache WHERE puuid = ? AND expires_at > ?');
  const result = stmt.get(puuid, Date.now());
  return result ? JSON.parse(result.store_data) : null;
}

export function setStoreCache(puuid, storeData, expiresAt) {
  const stmt = db.prepare(`
    INSERT INTO store_cache (puuid, store_data, fetched_at, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(puuid) DO UPDATE SET
      store_data = excluded.store_data,
      fetched_at = excluded.fetched_at,
      expires_at = excluded.expires_at
  `);
  stmt.run(puuid, JSON.stringify(storeData), Date.now(), expiresAt);
}

// Assets Cache (valorant-api.com)
export function getAssetsCache(key) {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const stmt = db.prepare('SELECT data FROM assets_cache WHERE key = ? AND fetched_at > ?');
  const result = stmt.get(key, Date.now() - ONE_DAY);
  return result ? JSON.parse(result.data) : null;
}

export function setAssetsCache(key, data) {
  const stmt = db.prepare(`
    INSERT INTO assets_cache (key, data, fetched_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      data = excluded.data,
      fetched_at = excluded.fetched_at
  `);
  stmt.run(key, JSON.stringify(data), Date.now());
}

// Match Cache
export function getMatchCache(puuid, matchId) {
  const stmt = db.prepare('SELECT match_data FROM match_cache WHERE puuid = ? AND match_id = ?');
  const result = stmt.get(puuid, matchId);
  return result ? JSON.parse(result.match_data) : null;
}

export function setMatchCache(puuid, matchId, matchData) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO match_cache (puuid, match_id, match_data, fetched_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(puuid, matchId, JSON.stringify(matchData), Date.now());
}

// Sessions
export function getSession(puuid) {
  const stmt = db.prepare('SELECT * FROM sessions WHERE puuid = ? AND expires_at > ?');
  return stmt.get(puuid, Date.now());
}

export function setSession(sessionData) {
  const { puuid, username, tag, shard, encrypted_tokens, expires_at } = sessionData;
  const stmt = db.prepare(`
    INSERT INTO sessions (puuid, username, tag, shard, encrypted_tokens, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(puuid) DO UPDATE SET
      username = excluded.username,
      tag = excluded.tag,
      shard = excluded.shard,
      encrypted_tokens = excluded.encrypted_tokens,
      expires_at = excluded.expires_at
  `);
  stmt.run(puuid, username, tag, shard, encrypted_tokens, Date.now(), expires_at);
}

export function deleteSession(puuid) {
  const stmt = db.prepare('DELETE FROM sessions WHERE puuid = ?');
  stmt.run(puuid);
}
