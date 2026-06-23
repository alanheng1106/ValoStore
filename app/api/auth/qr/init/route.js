import { NextResponse } from 'next/server';
import { initQrLogin } from '@/lib/riot-qr-auth';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const countryCode = body.countryCode || 'en-US';

    const { sessionId, loginUrl } = await initQrLogin(countryCode);

    return NextResponse.json({
      sessionId,
      loginUrl
    });
  } catch (error) {
    console.error('QR init error:', error);
    return NextResponse.json({ error: 'Failed to initialize QR login' }, { status: 500 });
  }
}
