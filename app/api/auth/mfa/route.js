import { NextResponse } from 'next/server';
import { verifyMfa } from '@/lib/riot-auth';
import { completeAuth } from '../login/route';

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, cookies } = body;

    if (!code || !cookies) {
      return NextResponse.json({ error: 'Code and cookies are required' }, { status: 400 });
    }

    const authRes = await verifyMfa(code, cookies);

    if (authRes.data?.type === 'error' || !authRes.data?.response?.parameters?.uri) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 401 });
    }

    const uri = authRes.data.response.parameters.uri;
    return await completeAuth(uri);

  } catch (error) {
    console.error('MFA error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
