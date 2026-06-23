import db from './lib/db.js';
import { fetchRiotApi } from './lib/valorant-api.js';

async function test() {
  try {
    const res = await fetchRiotApi('/store/v2/storefront/{puuid}');
    console.log(JSON.stringify(res).substring(0, 500));
  } catch (err) {
    console.error("Test error:", err);
  }
}
test();
