import https from 'https';
import { getRiotTokens } from './session';

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
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

export async function fetchRiotApi(endpoint, customOptions = {}) {
  const tokens = await getRiotTokens();
  if (!tokens) throw new Error('Unauthorized');

  const { access_token, entitlements_token, puuid, shard } = tokens;
  const baseUrl = `https://pd.${shard}.a.pvp.net`;
  
  const res = await httpsRequest(`${baseUrl}${endpoint.replace('{puuid}', puuid)}`, {
    method: customOptions.method || 'GET',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'X-Riot-Entitlements-JWT': entitlements_token,
      'Content-Type': 'application/json',
      'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
      'X-Riot-ClientVersion': 'release-09.00-shipping-5-2566778'
    }
  }, customOptions.body);

  return res.data;
}

export async function getStorefront() {
  return await fetchRiotApi('/store/v3/storefront/{puuid}', {
    method: 'POST',
    body: {}
  });
}

export async function getOwnedItems() {
  return await fetchRiotApi('/store/v1/entitlements/{puuid}/e7c63390-eda7-46e0-bb7a-a6abdacd2433');
}

export async function getWallet() {
  return await fetchRiotApi('/store/v1/wallet/{puuid}');
}

export async function getAccountXP() {
  return await fetchRiotApi('/account-xp/v1/players/{puuid}');
}
