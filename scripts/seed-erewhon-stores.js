/**
 * One-time seed for erewhon_stores. Erewhon has a small, fixed, rarely-changing
 * list of physical locations (15 currently operating, 2 more "coming soon"
 * with no live Algolia index yet) - so unlike Kroger/Target this doesn't need
 * a recurring import job, just a manual re-run if Erewhon opens a new store.
 *
 * Addresses come from https://erewhon.com/locations; location_id is each
 * store's Algolia search_index code (found via the site's own store
 * selector), used directly by fetch-erewhon-egg-prices.js.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const STORES = [
  { location_id: 'GROVE', name: 'Grove', address1: '7660 Beverly Blvd', city: 'Los Angeles', state: 'CA', zip: '90036', phone: '323-937-0777' },
  { location_id: 'CBS', name: 'Calabasas', address1: '26767 Agoura Rd', city: 'Calabasas', state: 'CA', zip: '91302', phone: '818-857-3366' },
  { location_id: 'SC', name: 'Studio City', address1: '12833 Ventura Blvd', city: 'Studio City', state: 'CA', zip: '91604', phone: '818-927-0661' },
  { location_id: 'VEN', name: 'Venice', address1: '585 Venice Blvd', city: 'Venice', state: 'CA', zip: '90291', phone: '310-362-3062' },
  { location_id: 'PAS', name: 'Pasadena', address1: '475 S Lake Ave', city: 'Pasadena', state: 'CA', zip: '91101', phone: '626-600-5665' },
  { location_id: 'BH', name: 'Beverly Hills', address1: '339 N Beverly Dr', city: 'Beverly Hills', state: 'CA', zip: '90210', phone: '424-313-1962' },
  { location_id: 'CC', name: 'Culver City', address1: '9300 Culver Blvd Suite 101', city: 'Culver City', state: 'CA', zip: '90232', phone: '310-893-1888' },
  { location_id: 'MB', name: 'Manhattan Beach', address1: '1700 Rosecrans Avenue', city: 'Manhattan Beach', state: 'CA', zip: '90266', phone: '424-220-2047' },
  { location_id: 'SM', name: 'Santa Monica', address1: '2800 Wilshire Blvd', city: 'Santa Monica', state: 'CA', zip: '90403', phone: '424-433-8111' },
  { location_id: 'SL', name: 'Silver Lake', address1: '4121 Santa Monica Blvd', city: 'Los Angeles', state: 'CA', zip: '90029', phone: '213-758-7854' },
  { location_id: 'WH', name: 'West Hollywood', address1: '8550 Santa Monica Blvd Suite 100', city: 'West Hollywood', state: 'CA', zip: '90069', phone: '213-817-7559' },
  { location_id: 'PAL', name: 'Palisades', address1: '15285 W. Sunset Blvd', city: 'Pacific Palisades', state: 'CA', zip: '90272', phone: '310-561-8898' },
  { location_id: 'TO', name: 'Thousand Oaks', address1: '2150 E. Thousand Oaks Boulevard', city: 'Thousand Oaks', state: 'CA', zip: '91362', phone: '323-370-7001' },
  { location_id: 'LAC', name: 'LACMA', address1: '5905 Wilshire Blvd', city: 'Los Angeles', state: 'CA', zip: '90036', phone: '323-370-7001' },
  { location_id: 'GD', name: 'Glendale', address1: '520 N Glendale Ave', city: 'Glendale', state: 'CA', zip: '91206', phone: '818-676-9011' },
];

async function geocode(store) {
  // Strip suite/unit numbers - Nominatim often can't resolve those.
  const cleanAddress = store.address1.replace(/\s*(suite|ste)\s*\S+/i, '');
  const query = `${cleanAddress}, ${store.city}, ${store.state} ${store.zip}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'eggs.live-data-pipeline/1.0 (one-time store geocode)' } });
  if (!res.ok) throw new Error(`Geocode failed for ${store.name}: ${res.status}`);
  const json = await res.json();
  if (!json.length) throw new Error(`No geocode result for ${store.name} (${query})`);
  return { latitude: parseFloat(json[0].lat), longitude: parseFloat(json[0].lon) };
}

(async () => {
  const rows = [];
  for (const store of STORES) {
    const { latitude, longitude } = await geocode(store);
    console.log(`${store.name}: ${latitude}, ${longitude}`);
    rows.push({ ...store, latitude, longitude });
    await new Promise((r) => setTimeout(r, 1100)); // Nominatim usage policy: max 1 req/sec
  }

  const { error } = await sb.from('erewhon_stores').upsert(rows, { onConflict: 'location_id' });
  if (error) throw error;
  console.log(`✅ Seeded ${rows.length} Erewhon stores`);
})();
