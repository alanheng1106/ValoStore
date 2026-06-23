import { NextResponse } from 'next/server';
import { initAuth, login, getEntitlements, getUserInfo, getRegion, extractTokensFromUri } from '@/lib/riot-auth';
import { createBrowserSession, encryptTokens } from '@/lib/session';
import { setSession } from '@/lib/cache';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const initCookies = await initAuth();
    const authRes = await login(username, password, initCookies);

    if (authRes.data?.type === 'multifactor') {
      // Need 2FA
      return NextResponse.json({
        requires_mfa: true,
        email_hint: authRes.data.multifactor.email,
        cookies: authRes.cookies // Send intermediate cookies to the client temporarily
      });
    }

    if (authRes.data?.type === 'error' || !authRes.data?.response?.parameters?.uri) {
      return NextResponse.json({ error: 'Authentication failed. Please check your credentials.' }, { status: 401 });
    }

    // Auth Success
    const uri = authRes.data.response.parameters.uri;
    return await completeAuth(uri);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function completeAuth(uri) {
  try {
    const tokens = extractTokensFromUri(uri);
    if (!tokens) {
      return NextResponse.json({ error: 'Failed to extract tokens' }, { status: 500 });
    }

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

    // Save browser session
    await createBrowserSession({ puuid: userInfo.sub });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete auth error:', error);
    return NextResponse.json({ error: 'Failed to complete authentication' }, { status: 500 });
  }
}
