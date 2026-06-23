import https from 'https';

const ciphers = [
  'TLS_CHACHA20_POLY1305_SHA256',
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
];

const agent = new https.Agent({
  ciphers: ciphers.join(':'),
  honorCipherOrder: true,
  minVersion: 'TLSv1.2',
});

const defaultHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'RiotClient/65.0.1.4971241.4789512 rso-auth (Windows;10;;Professional, x64)',
  'Accept': 'application/json, text/plain, */*'
};

function httpsRequest(urlStr, options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      agent: agent
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
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
