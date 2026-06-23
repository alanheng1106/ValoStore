import https from 'https';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for pending QR sessions (short-lived, no need for DB)
const pendingQrSessions = new Map();

function httpsRequest(urlStr, options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Collect set-cookie headers
        const setCookieHeaders = res.headers['set-cookie'] || [];
        resolve({
          status: res.statusCode,
          headers: res.headers,
          setCookieHeaders,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    req.end();
  });
}

function parseCookiesFromHeaders(setCookieHeaders) {
  const cookies = {};
  if (!setCookieHeaders) return cookies;
  setCookieHeaders.forEach(cookieStr => {
    const parts = cookieStr.split(';');
    const [nameValue] = parts;
    const eqIdx = nameValue.indexOf('=');
    if (eqIdx > 0) {
      const name = nameValue.substring(0, eqIdx).trim();
      const value = nameValue.substring(eqIdx + 1).trim();
      cookies[name] = value;
    }
  });
  return cookies;
}

function stringifyCookies(cookies) {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}

/**
 * Step 1: Initialize a QR login session
 * - Calls Riot's client config endpoint
 * - Calls Riot's openid-configuration
 * - POSTs to authenticate.riotgames.com to get QR code data
 * Returns: { sessionId, loginUrl, cluster, suuid, timestamp }
 */
export async function initQrLogin(countryCode = 'en-US') {
  const sdkSid = uuidv4();
  const traceId = uuidv4().replace(/-/g, '');
  const parentId = uuidv4().replace(/-/g, '').substring(0, 16);
  const traceparent = `00-${traceId}-${parentId}-00`;

  const regionMap = {
    'en-US': 'NA', 'ko-KR': 'KR', 'ja-JP': 'JP',
    'zh-CN': 'CN', 'zh-TW': 'TW', 'es-ES': 'EUW',
    'fr-FR': 'EUW', 'de-DE': 'EUW', 'ru-RU': 'RU',
    'pt-BR': 'BR', 'th-TH': 'TH', 'vi-VN': 'VN',
  };
  const region = regionMap[countryCode] || 'NA';
  const language = countryCode.replace('-', '_');

  const commonBaggage = `sdksid=${sdkSid}`;

  // Step 1a: Hit client config (establishes session context)
  await httpsRequest(
    `https://clientconfig.rpg.riotgames.com/api/v1/config/public?os=windows&region=${region}&app=Riot%20Client&version=97.0.1.2366&patchline=KeystoneFoundationLiveWin`,
    {
      method: 'GET',
      headers: {
        'Host': 'clientconfig.rpg.riotgames.com',
        'user-agent': 'RiotGamesApi/24.9.1.4445 client-config (Windows;10;;Professional, x64) riot_client/0',
        'Accept': 'application/json',
        'baggage': commonBaggage,
        'traceparent': traceparent,
        'country-code': countryCode
      }
    }
  );

  // Step 1b: Hit openid-configuration
  const oidcRes = await httpsRequest(
    'https://auth.riotgames.com/.well-known/openid-configuration',
    {
      method: 'GET',
      headers: {
        'Host': 'auth.riotgames.com',
        'user-agent': 'RiotGamesApi/24.9.1.4445 rso-auth (Windows;10;;Professional, x64) riot_client/0',
        'Accept': 'application/json',
        'baggage': commonBaggage,
        'traceparent': traceparent,
        'country-code': countryCode
      }
    }
  );
  const oidcCookies = parseCookiesFromHeaders(oidcRes.setCookieHeaders);

  // Step 1c: POST to authenticate endpoint with qrcode flag
  const loginData = {
    client_id: 'riot-client',
    language: language,
    platform: 'windows',
    remember: false,
    type: 'auth',
    qrcode: {}
  };

  const authRes = await httpsRequest(
    'https://authenticate.riotgames.com/api/v1/login',
    {
      method: 'POST',
      headers: {
        'Host': 'authenticate.riotgames.com',
        'user-agent': 'RiotGamesApi/24.9.1.4445 rso-authenticator (Windows;10;;Professional, x64) riot_client/0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'baggage': commonBaggage,
        'traceparent': traceparent,
        'country-code': countryCode,
        'Cookie': stringifyCookies(oidcCookies)
      }
    },
    JSON.stringify(loginData)
  );

  const authCookies = {
    ...oidcCookies,
    ...parseCookiesFromHeaders(authRes.setCookieHeaders)
  };

  const { cluster, suuid, timestamp } = authRes.data || {};
  if (!cluster || !suuid || !timestamp) {
    throw new Error('Failed to initialize QR login session');
  }

  const loginUrl = `https://qrlogin.riotgames.com/riotmobile?cluster=${cluster}&suuid=${suuid}&timestamp=${timestamp}&utm_source=riotclient&utm_medium=client&utm_campaign=qrlogin-riotmobile`;

  // Store session data for polling
  const sessionId = uuidv4();
  pendingQrSessions.set(sessionId, {
    cookies: authCookies,
    sdkSid,
    countryCode,
    createdAt: Date.now(),
    cluster,
    suuid,
    timestamp
  });

  // Auto-cleanup after 5 minutes
  setTimeout(() => pendingQrSessions.delete(sessionId), 5 * 60 * 1000);

  return { sessionId, loginUrl };
}

/**
 * Step 2: Poll for QR scan result
 * GETs authenticate.riotgames.com/api/v1/login with the stored session cookies
 * Returns: { status: 'pending' | 'success' | 'expired', loginToken? }
 */
export async function pollQrLogin(sessionId) {
  const session = pendingQrSessions.get(sessionId);
  if (!session) {
    return { status: 'expired' };
  }

  // Check if session is too old (5 min)
  if (Date.now() - session.createdAt > 5 * 60 * 1000) {
    pendingQrSessions.delete(sessionId);
    return { status: 'expired' };
  }

  const traceparent = `00-${uuidv4().replace(/-/g, '')}-${uuidv4().replace(/-/g, '').substring(0, 16)}-00`;

  const res = await httpsRequest(
    'https://authenticate.riotgames.com/api/v1/login',
    {
      method: 'GET',
      headers: {
        'Host': 'authenticate.riotgames.com',
        'user-agent': 'RiotGamesApi/24.9.1.4445 rso-authenticator (Windows;10;;Professional, x64) riot_client/0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'baggage': `sdksid=${session.sdkSid}`,
        'traceparent': traceparent,
        'country-code': session.countryCode,
        'Cookie': stringifyCookies(session.cookies)
      }
    }
  );

  // Update cookies from response
  const newCookies = parseCookiesFromHeaders(res.setCookieHeaders);
  session.cookies = { ...session.cookies, ...newCookies };

  console.log('[QR Poll] Raw Response:', res.status, JSON.stringify(res.data));

  if (!res.data) {
    return { status: 'pending' };
  }

  if (res.data.type === 'success' && res.data.success?.login_token) {
    pendingQrSessions.delete(sessionId);
    return { status: 'success', loginToken: res.data.success.login_token };
  }

  return { status: 'pending' };
}

/**
 * Step 3: Exchange login_token for access_token
 * - POST login_token to auth.riotgames.com/api/v1/login-token
 * - POST authorization request to get the access token URI
 */
export async function exchangeLoginToken(loginToken) {
  const sdkSid = uuidv4();
  const traceparent = `00-${uuidv4().replace(/-/g, '')}-${uuidv4().replace(/-/g, '').substring(0, 16)}-00`;

  const commonHeaders = {
    'Host': 'auth.riotgames.com',
    'user-agent': 'RiotGamesApi/24.10.1.4471 rso-auth (Windows;10;;Professional, x64) riot_client/0',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'baggage': `sdksid=${sdkSid}`,
    'traceparent': traceparent
  };

  // Step 3a: Submit login_token
  const tokenRes = await httpsRequest(
    'https://auth.riotgames.com/api/v1/login-token',
    { method: 'POST', headers: commonHeaders },
    JSON.stringify({
      authentication_type: null,
      code_verifier: '',
      login_token: loginToken,
      persist_login: false
    })
  );

  if (tokenRes.status !== 204) {
    throw new Error('Login token submission failed');
  }

  // Collect cookies from login-token response
  const loginCookies = parseCookiesFromHeaders(tokenRes.setCookieHeaders);

  // Step 3b: Request authorization
  const authRes = await httpsRequest(
    'https://auth.riotgames.com/api/v1/authorization',
    {
      method: 'POST',
      headers: {
        ...commonHeaders,
        'Cookie': stringifyCookies(loginCookies)
      }
    },
    JSON.stringify({
      acr_values: '',
      claims: '',
      client_id: 'riot-client',
      code_challenge: '',
      code_challenge_method: '',
      nonce: uuidv4(),
      redirect_uri: 'http://localhost/redirect',
      response_type: 'token id_token',
      scope: 'openid link ban lol_region account'
    })
  );

  if (authRes.status !== 200 || !authRes.data?.response?.parameters?.uri) {
    throw new Error('Authorization failed');
  }

  const uri = authRes.data.response.parameters.uri;

  // Extract access_token and id_token from URI fragment
  const fragmentStr = uri.split('#')[1] || '';
  const params = new URLSearchParams(fragmentStr);

  return {
    accessToken: params.get('access_token'),
    idToken: params.get('id_token'),
    expiresIn: parseInt(params.get('expires_in') || '3600', 10)
  };
}
