import { NextResponse } from 'next/server';
import { pollQrLogin, exchangeLoginToken } from '@/lib/riot-qr-auth';
import { getEntitlements, getUserInfo, getRegion } from '@/lib/riot-auth';
import { createBrowserSession, encryptTokens } from '@/lib/session';
import { setSession } from '@/lib/cache';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const pollResult = await pollQrLogin(sessionId);

    if (pollResult.status === 'pending') {
      return NextResponse.json({ status: 'pending' });
    }

    if (pollResult.status === 'expired') {
      return NextResponse.json({ status: 'expired' });
    }

    // status === 'success' — exchange login_token for access_token
    const tokens = await exchangeLoginToken(pollResult.loginToken);

    if (!tokens.accessToken) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }

    // Get entitlements, user info, and region
    const entitlementsToken = await getEntitlements(tokens.accessToken);
    const userInfo = await getUserInfo(tokens.accessToken);
    const shard = await getRegion(tokens.accessToken, tokens.idToken);

    // Save to DB
    const riotTokens = {
      access_token: tokens.accessToken,
      entitlements_token: entitlementsToken,
      id_token: tokens.idToken
    };

    setSession({
      puuid: userInfo.sub,
      username: userInfo.acct?.game_name,
      tag: userInfo.acct?.tag_line,
      shard: shard,
      encrypted_tokens: encryptTokens(riotTokens),
      expires_at: Date.now() + (tokens.expiresIn * 1000)
    });

    // Set browser session cookie
    await createBrowserSession({ puuid: userInfo.sub });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('QR poll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
