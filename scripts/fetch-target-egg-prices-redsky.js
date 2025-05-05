import { config } from 'dotenv';
config({ path: '.env.local' });
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Env check
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
// Allow REDSKY_KEY from env, falling back to public default
const REDSKY_KEY = process.env.REDSKY_KEY || 'ff457966e64d5e877fdbad070f276d18ecec4a01';
if (!process.env.REDSKY_KEY) console.warn('⚠️ REDSKY_KEY not set, using default public key');
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Classification helper
function classifyEggProduct(title) {
  if (!title) return null;
  const txt = title.toLowerCase();
  if (!/egg/.test(txt) || !/(\b12\s*ct\b|\bdozen\b)/i.test(txt)) return null;
  if (/organic/.test(txt) || /\borg\b/.test(txt)) return 'organic';
  return 'regular';
}

// Fetch via RedSky API with v2 and fallbacks
async function fetchEggsFromRedsky(storeId, zip, state) {
  // Normalize zip to first 5 digits and omit full state
  const zip5 = zip ? String(zip).split('-')[0] : undefined;
  const limit = 100;
  let offset = 0;
  const results = [];
  const base = 'https://redsky.target.com/redsky_aggregations/v1/web/';
  while (true) {
    let products = [];
    // Try v2 endpoint
    {
      const url = new URL(`${base}plp_search_v2`);
      url.searchParams.set('keyword', 'eggs');
      url.searchParams.set('storeId', storeId);
      url.searchParams.set('channel', 'WEB');
      if (zip5) url.searchParams.set('zip', zip5);
      url.searchParams.set('offset', offset);
      url.searchParams.set('limit', limit);
      url.searchParams.set('key', REDSKY_KEY);
      url.searchParams.set('scheduledDeliveryStoreId', storeId);
      url.searchParams.set('pricingStoreId', storeId);
      console.log(`→ [API v2] ${url}`);
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const json = await res.json();
        products = json.data?.search?.products || [];
      }
    }
    // Fallback to legacy plp_search
    if (products.length === 0) {
      const url = new URL(`${base}plp_search`);
      url.searchParams.set('keyword', 'eggs');
      url.searchParams.set('storeId', storeId);
      url.searchParams.set('channel', 'WEB');
      if (zip5) url.searchParams.set('zip', zip5);
      url.searchParams.set('offset', offset);
      url.searchParams.set('limit', limit);
      url.searchParams.set('key', REDSKY_KEY);
      url.searchParams.set('scheduledDeliveryStoreId', storeId);
      url.searchParams.set('pricingStoreId', storeId);
      console.log(`→ [API legacy] ${url}`);
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const json = await res.json();
        products = json.data?.search?.products || [];
      }
    }
    // Fallback to plp_browse
    if (products.length === 0) {
      const url = new URL(`${base}plp_browse`);
      url.searchParams.set('keyword', 'eggs');
      url.searchParams.set('storeId', storeId);
      url.searchParams.set('channel', 'WEB');
      if (zip5) url.searchParams.set('zip', zip5);
      url.searchParams.set('offset', offset);
      url.searchParams.set('limit', limit);
      url.searchParams.set('key', REDSKY_KEY);
      url.searchParams.set('scheduledDeliveryStoreId', storeId);
      url.searchParams.set('pricingStoreId', storeId);
      console.log(`→ [API browse] ${url}`);
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const json = await res.json();
        products = json.data?.search?.products || [];
      }
    }
    console.log(`→ Got ${products.length} products`);
    if (products.length === 0) break;
    results.push(...products);
    if (products.length < limit) break;
    offset += limit;
  }
  console.log(`→ Total collected ${results.length} products`);
  return results;
}

// Load all stores
async function getAllStores() {
  const all = [];
  const pageSize = 1000;
  for (let from = 0;; from += pageSize) {
    const { data, error } = await sb
      .from('target_stores')
      .select('store_id, zip, state, city')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
  }
  return all;
}

(async () => {
  console.log('📦 Loading stores...');
  let stores;
  try {
    stores = await getAllStores();
    console.log(`→ ${stores.length} stores loaded.`);
    // Debug: allow passing a single store_id as CLI arg
    const args = process.argv.slice(2);
    const debugStore = args[0] ? Number(args[0]) : null;
    if (debugStore) {
      stores = stores.filter(s => s.store_id === debugStore);
      console.log(`→ Debug mode: processing only store ${debugStore}`);
    }
  } catch (e) {
    console.error('❌ Error loading stores', e);
    process.exit(1);
  }

  const now = new Date();
  const captured_date = now.toISOString().split('T')[0];
  const captured_at = now.toISOString();

  for (const { store_id, zip, state, city } of stores) {
    console.log(`\n===== Store ${store_id} — ${city}, ${state} ${zip} =====`);
    const products = await fetchEggsFromRedsky(store_id, zip, state);
    // classify
    const pricesByType = { regular: [], organic: [] };
    for (const p of products) {
      const type = classifyEggProduct(p.title);
      if (!type) continue;
      const price = typeof p.price?.current_retail_price === 'number'
        ? p.price.current_retail_price
        : parseFloat(p.price?.regular || p.price?.promo || p.price?.final || '0');
      if (price > 0) pricesByType[type].push(price);
    }
    // compute stats
    const payload = [];
    for (const [type, arr] of Object.entries(pricesByType)) {
      if (!arr.length) continue;
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      payload.push({ store_id, product_type: type, captured_date, captured_at, min_price: min, avg_price: Number(avg.toFixed(2)), max_price: max });
    }
    if (payload.length) {
      console.log(`→ Upserting ${payload.length} rows for store ${store_id}`);
      const { error } = await sb
        .from('target_egg_price_stats')
        .upsert(payload, { onConflict: ['store_id', 'product_type', 'captured_date'] });
      if (error) console.error('❌ Upsert error', error);
    } else {
      console.log('⚠️ No egg products found');
    }
  }

  console.log('🏁 Done.');
  process.exit(0);
})(); 