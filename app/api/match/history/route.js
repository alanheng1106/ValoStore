import { NextResponse } from 'next/server';
import { getMatches } from '@/lib/henrik-api';
import { getRiotTokens } from '@/lib/session';
import db from '@/lib/db';

export async function GET() {
  try {
    const tokens = await getRiotTokens();
    if (!tokens) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionStmt = db.prepare('SELECT * FROM sessions WHERE puuid = ?');
    const session = sessionStmt.get(tokens.puuid);
    if (!session || !session.username || !session.tag || !session.shard) {
      return NextResponse.json({ error: 'Incomplete session data' }, { status: 400 });
    }

    const region = session.shard;
    const name = session.username;
    const tag = session.tag;

    const CACHE_KEY = `matches_${tokens.puuid}`;
    const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

    const cacheStmt = db.prepare('SELECT data FROM assets_cache WHERE key = ? AND fetched_at > ?');
    const cached = cacheStmt.get(CACHE_KEY, Date.now() - CACHE_TIME);
    
    if (cached) {
      return NextResponse.json(JSON.parse(cached.data));
    }

    const matchesData = await getMatches(region, name, tag);
    
    const insertStmt = db.prepare(`
      INSERT INTO assets_cache (key, data, fetched_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        data = excluded.data,
        fetched_at = excluded.fetched_at
    `);
    insertStmt.run(CACHE_KEY, JSON.stringify(matchesData), Date.now());
    
    return NextResponse.json(matchesData);
  } catch (error) {
    console.error('Match History API Error:', error);
    return NextResponse.json({ error: 'Internal server error or rate limit exceeded' }, { status: 500 });
  }
}
