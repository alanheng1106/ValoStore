import { getAssetsCache, setAssetsCache } from './cache';

const BASE_URL = 'https://valorant-api.com/v1';

export async function fetchWithCache(endpoint) {
  const cacheKey = `vapi:${endpoint}`;
  const cached = getAssetsCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}${endpoint}`);
  const json = await res.json();
  
  if (json.status === 200) {
    setAssetsCache(cacheKey, json.data);
    return json.data;
  }
  return null;
}

export async function getWeapons() {
  return await fetchWithCache('/weapons');
}

export async function getSkins() {
  const weapons = await getWeapons();
  if (!weapons) return [];
  
  const allSkins = [];
  weapons.forEach(weapon => {
    weapon.skins.forEach(skin => {
      allSkins.push({
        ...skin,
        weaponUuid: weapon.uuid,
        weaponName: weapon.displayName
      });
    });
  });
  return allSkins;
}

export async function getContentTiers() {
  return await fetchWithCache('/contenttiers');
}
