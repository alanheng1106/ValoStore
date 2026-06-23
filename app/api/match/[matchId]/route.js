import { NextResponse } from 'next/server';
import { getRiotTokens } from '@/lib/session';
import db from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { matchId } = params;
    const tokens = await getRiotTokens();
    if (!tokens) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const CACHE_KEY = `matches_${tokens.puuid}`;
    
    // Check if the match exists in the cached matches array
    const cacheStmt = db.prepare('SELECT data FROM assets_cache WHERE key = ?');
    const cached = cacheStmt.get(CACHE_KEY);
    
    if (cached) {
      const matches = JSON.parse(cached.data);
      const match = matches.find(m => m.metadata.matchid === matchId);
      if (match) {
        return NextResponse.json(match);
      }
    }

    // If not found in cache, we could fetch from Henrik API directly using matchId
    // But since the user navigates from the matches list, it should always be cached.
    return NextResponse.json({ error: 'Match not found in recent history cache' }, { status: 404 });
  } catch (error) {
    console.error('Match Details API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
