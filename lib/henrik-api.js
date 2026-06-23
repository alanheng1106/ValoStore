const API_URL = 'https://api.henrikdev.xyz/valorant';
const API_KEY = process.env.HENRIK_API_KEY;

export async function fetchHenrikApi(endpoint) {
  const headers = {};
  if (API_KEY) {
    headers['Authorization'] = API_KEY;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  const data = await res.json();
  
  if (data.status === 200) {
    return data.data;
  }
  
  throw new Error(`Henrik API Error: ${data.status}`);
}

export async function getMatches(region, name, tag) {
  // Using v3 matches endpoint
  return await fetchHenrikApi(`/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

export async function getMMR(region, puuid) {
  return await fetchHenrikApi(`/v2/by-puuid/mmr/${region}/${puuid}`);
}

export async function getAccount(name, tag) {
  return await fetchHenrikApi(`/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}
