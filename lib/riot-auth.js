import initCycleTLS from 'cycletls';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'RiotClient/65.0.1.4971241.4789512 rso-auth (Windows;10;;Professional, x64)',
  'Accept': 'application/json, text/plain, */*'
};

// Singleton CycleTLS instance to avoid spawning multiple Go processes
let cycleTLSInstance = null;

async function getCycleTLS() {
  if (!cycleTLSInstance) {
    cycleTLSInstance = await initCycleTLS();
  }
  return cycleTLSInstance;
}

async function httpsRequest(urlStr, options, bodyData = null) {
  const cycleTLS = await getCycleTLS();
  
  const res = await cycleTLS(urlStr, {
    body: bodyData,
    headers: options.headers || defaultHeaders,
    ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0',
    userAgent: options.headers?.['User-Agent'] || defaultHeaders['User-Agent']
  }, (options.method || 'GET').toLowerCase());

  // Convert cycletls response headers to standard node format
  let headers = res.headers;
  // cycletls sometimes returns Set-Cookie as an array
  if (headers && headers['Set-Cookie']) {
    headers['set-cookie'] = Array.isArray(headers['Set-Cookie']) ? headers['Set-Cookie'] : [headers['Set-Cookie']];
  }

  let data = null;
  try {
    data = typeof res.body === 'string' ? JSON.parse(res.body) : res.body;
  } catch (e) {
    // If not JSON, leave null or keep string
  }

  return {
    status: res.status,
    headers: headers,
    data: data
  };
}

function parseCookies(setCookieHeader) {
  if (!setCookieHeader) return {};
  const cookies = {};
  setCookieHeader.forEach(cookieStr => {
    const parts = cookieStr.split(';');
    const [nameValue] = parts;
    const [name, value] = nameValue.split('=');
    cookies[name] = value;
  });
  return cookies;
}

function stringifyCookies(cookies) {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}

export async function initAuth() {
  const url = 'https://auth.riotgames.com/api/v1/authorization';
  const body = JSON.stringify({
    client_id: 'play-valorant-web-prod',
    nonce: '1',
    redirect_uri: 'https://playvalorant.com/opt_in',
    response_type: 'token id_token',
  });

  const res = await httpsRequest(url, {
    method: 'POST',
    headers: defaultHeaders
  }, body);

  const cookies = parseCookies(res.headers['set-cookie']);
  return cookies;
}

export async function login(username, password, cookies) {
  const url = 'https://auth.riotgames.com/api/v1/authorization';
  const body = JSON.stringify({
    type: 'auth',
    username,
    password,
    remember: true,
  });

  const res = await httpsRequest(url, {
    method: 'PUT',
    headers: {
      ...defaultHeaders,
      'Cookie': stringifyCookies(cookies)
    }
  }, body);

  const newCookies = { ...cookies, ...parseCookies(res.headers['set-cookie']) };
  return { data: res.data, cookies: newCookies };
}

export async function verifyMfa(code, cookies) {
  const url = 'https://auth.riotgames.com/api/v1/authorization';
  const body = JSON.stringify({
    type: 'multifactor',
    code,
    rememberDevice: true
  });

  const res = await httpsRequest(url, {
    method: 'PUT',
    headers: {
      ...defaultHeaders,
      'Cookie': stringifyCookies(cookies)
    }
  }, body);

  const newCookies = { ...cookies, ...parseCookies(res.headers['set-cookie']) };
  return { data: res.data, cookies: newCookies };
}

export function extractTokensFromUri(uri) {
  const match = uri.match(/access_token=((?:[a-zA-Z]|\d|\.|-|_)*).*id_token=((?:[a-zA-Z]|\d|\.|-|_)*).*expires_in=(\d*)/);
  if (match) {
    return {
      accessToken: match[1],
      idToken: match[2],
      expiresIn: parseInt(match[3], 10)
    };
  }
  return null;
}

export async function getEntitlements(accessToken) {
  const url = 'https://entitlements.auth.riotgames.com/api/token/v1';
  const res = await httpsRequest(url, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return res.data.entitlements_token;
}

export async function getUserInfo(accessToken) {
  const url = 'https://auth.riotgames.com/userinfo';
  const res = await httpsRequest(url, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return res.data;
}

export async function getRegion(accessToken, idToken) {
  const url = 'https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant';
  const res = await httpsRequest(url, {
    method: 'PUT',
    headers: {
      ...defaultHeaders,
      'Authorization': `Bearer ${accessToken}`
    }
  }, JSON.stringify({ id_token: idToken }));
  return res.data.affinities.live;
}
