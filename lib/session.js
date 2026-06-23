import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getSession } from './cache';

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';
const key = new TextEncoder().encode(secretKey);

const encryptionKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';

// Encrypt Riot tokens for DB storage
export function encryptTokens(tokens) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt Riot tokens from DB
export function decryptTokens(encryptedString) {
  try {
    const [ivHex, encryptedHex] = encryptedString.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Failed to decrypt tokens', err);
    return null;
  }
}

export async function createBrowserSession(payload) {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
    
  (await cookies()).set('session', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function verifyBrowserSession() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function deleteBrowserSession() {
  (await cookies()).delete('session');
}

export async function getRiotTokens() {
  const session = await verifyBrowserSession();
  if (!session || !session.puuid) return null;

  const dbSession = getSession(session.puuid);
  if (!dbSession) return null;

  const tokens = decryptTokens(dbSession.encrypted_tokens);
  return { ...tokens, puuid: session.puuid, shard: dbSession.shard };
}
