import { NextResponse } from 'next/server';
import { deleteBrowserSession, verifyBrowserSession } from '@/lib/session';
import { deleteSession } from '@/lib/cache';

export async function POST() {
  try {
    const session = await verifyBrowserSession();
    if (session?.puuid) {
      deleteSession(session.puuid);
    }
    await deleteBrowserSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
