import fetch from 'node-fetch';
import { config } from 'dotenv';
config({ path: '.env.local' });

const { KROGER_CLIENT_ID, KROGER_CLIENT_SECRET } = process.env;

if (!KROGER_CLIENT_ID || !KROGER_CLIENT_SECRET) {
  console.error('Missing creds');
  process.exit(1);
}

async function getToken() {
  const body = new URLSearchParams({ grant_type: 'client_credentials', scope: 'product.compact' });
  const res = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });
  if (!res.ok) throw new Error('token fail ' + res.status);
  return (await res.json()).access_token;
}

(async () => {
  const token = await getToken();
  const url = new URL('https://api.kroger.com/v1/products');
  url.searchParams.set('filter.locationId', '01100002');
  url.searchParams.set('filter.term', 'eggs');
  url.searchParams.set('filter.limit', '50');
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  console.log('status', res.status);
  const body = await res.text();
  console.log(body.slice(0, 500));
})(); 