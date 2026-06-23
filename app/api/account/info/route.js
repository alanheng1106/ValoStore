import { NextResponse } from 'next/server';
import { getWallet, getAccountXP } from '@/lib/valorant-api';
import { getMMR, getAccount } from '@/lib/henrik-api';
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

    // Try to get cached data to improve performance
    const CACHE_KEY = `account_${tokens.puuid}`;
    const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

    const cacheStmt = db.prepare('SELECT data FROM assets_cache WHERE key = ? AND fetched_at > ?');
    const cached = cacheStmt.get(CACHE_KEY, Date.now() - CACHE_TIME);
    
    if (cached) {
      return NextResponse.json(JSON.parse(cached.data));
    }

    // Fetch data in parallel
    const [wallet, xp, mmr, accountInfo] = await Promise.all([
      getWallet().catch(() => null),
      getAccountXP().catch(() => null),
      getMMR(session.shard, tokens.puuid).catch(() => null),
      getAccount(session.username, session.tag).catch(() => null)
    ]);

    const accountData = {
      username: session.username,
      tag: session.tag,
      puuid: tokens.puuid,
      shard: session.shard,
      wallet: wallet ? {
        vp: wallet.Balances['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'] || 0,
        rad: wallet.Balances['e59aa87c-4cbf-517a-5983-6e81511be9b7'] || 0,
        kc: wallet.Balances['85ca954a-41f2-ce94-9b45-8ca3dd39a00d'] || 0,
      } : null,
      xp: xp ? {
        level: xp.Progress.Level,
        xp: xp.Progress.XP,
      } : null,
      mmr: mmr ? {
        currentTier: mmr.current_data.currenttier,
        currentTierName: mmr.current_data.currenttierpatched,
        elo: mmr.current_data.elo,
        mmrChange: mmr.current_data.mmr_change_to_last_game,
        rankingInTier: mmr.current_data.ranking_in_tier,
        images: mmr.current_data.images
      } : null,
      card: accountInfo ? accountInfo.card : null
    };

    const insertStmt = db.prepare(`
      INSERT INTO assets_cache (key, data, fetched_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        data = excluded.data,
        fetched_at = excluded.fetched_at
    `);
    insertStmt.run(CACHE_KEY, JSON.stringify(accountData), Date.now());

    return NextResponse.json(accountData);
  } catch (error) {
    console.error('Account API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
