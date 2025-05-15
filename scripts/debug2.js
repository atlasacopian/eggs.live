import fetch from 'node-fetch';
import { config } from 'dotenv';
config({ path: '.env.local' });

const { KROGER_CLIENT_ID, KROGER_CLIENT_SECRET } = process.env;

let cachedToken = null;
let tokenExpires = 0;
async function getToken () {
  if (cachedToken && Date.now() < tokenExpires - 60_000) return cachedToken;
  const body = new URLSearchParams({ grant_type: 'client_credentials', scope: 'product.compact' });
  const res = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const json = await res.json();
  cachedToken = json.access_token;
  tokenExpires = Date.now() + json.expires_in * 1000;
  return cachedToken;
}

async function fetchStoreEggs (location_id) {
  const token = await getToken();
  const base = new URL('https://api.kroger.com/v1/products');
  base.searchParams.set('filter.locationId', location_id);
  base.searchParams.set('filter.term', 'eggs');
  base.searchParams.set('filter.limit', '50');

  let start = 1;
  while (true) {
    if (start > 1) base.searchParams.set('filter.start', String(start));
    const res = await fetch(base, { headers: { authorization: `Bearer ${token}` } });
    console.log(location_id, 'status', res.status);
    if (!res.ok) {
      console.log('error body', await res.text());
      break;
    }
    const json = await res.json();
    console.log('products', json.data?.length);
    break;
  }
}

fetchStoreEggs('01100002'); 