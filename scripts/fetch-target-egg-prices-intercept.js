import { config } from 'dotenv';
config({ path: '.env.local' });
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Ensure required environment variables
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, REDSKY_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}
// Use provided RedSky key or fallback to built-in public key
const USED_REDSKY_KEY = REDSKY_KEY || 'ff457966e64d5e877fdbad070f276d18ecec4a01';
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Set DEBUG_STORE_IDS to an array of store IDs (numbers or strings) to process only those stores
const DEBUG_STORE_IDS = null; // Process all stores

const MAX_CONCURRENT_REQUESTS = 5; // Limit concurrency

/**
 * Classify a product title into 'regular' or 'organic' for 12-pack eggs.
 */
function classifyEggProduct(title) {
  if (!title) return null;
  const txt = title.toLowerCase();
  const exclude = ['eggo', 'frozen', 'pancake', 'waffle', 'muffin', 'protein', 'powder', 'hard-cooked', 'scramble', 'liquid', 'bites'];
  if (exclude.some((w) => txt.includes(w))) return null;
  if (!/\beggs?\b/.test(txt)) return null;
  if (!/(\b12(?:\s*ct|\s*pk)?\b|\bdozen\b|\bdoz\b|\b12\b)/i.test(txt)) return null;
  if (/organic/.test(txt) || /\borg\b/.test(txt)) return 'organic';
  return 'regular';
}

/**
 * Fetch all egg products for a specific store via RedSky API, handling pagination and v1 fallback.
 */
async function fetchEggsFromRedSky(storeId, zip, visitorId, enableLog = false) {
  const all = [];
  const limit = 24;
  for (let offset = 0; ; offset += limit) {
    // Try the v2 endpoint first
    const urlV2 = new URL('https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2');
    urlV2.searchParams.set('key', USED_REDSKY_KEY);
    urlV2.searchParams.set('keyword', 'eggs');
    urlV2.searchParams.set('pricing_store_id', storeId);
    urlV2.searchParams.set('count', limit.toString());
    urlV2.searchParams.set('offset', offset.toString());
    urlV2.searchParams.set('channel', 'WEB');
    urlV2.searchParams.set('scheduled_delivery_store_id', storeId);
    urlV2.searchParams.set('page', '/s/eggs');
    urlV2.searchParams.set('visitor_id', visitorId);
    if (zip) urlV2.searchParams.set('zip', zip);

    if (enableLog) console.log(`→ [RedSky v2] Fetching: ${urlV2.toString()}`);
    let res = await fetch(urlV2.toString(), { headers: { 'User-Agent': USER_AGENT } });

    // If v2 fails (404 or other non-2xx), try v1
    if (!res.ok && res.status === 404) {
      if (enableLog) console.log(`  → RedSky v2 failed (${res.status}), falling back to v1 for store ${storeId}`);
      const urlV1 = new URL('https://redsky.target.com/redsky_aggregations/v1/web/plp_search');
      urlV1.searchParams.set('key', USED_REDSKY_KEY);
      urlV1.searchParams.set('keyword', 'eggs');
      urlV1.searchParams.set('storeId', storeId);
      urlV1.searchParams.set('limit', limit.toString());
      urlV1.searchParams.set('offset', offset.toString());
      urlV1.searchParams.set('visitor_id', visitorId);
      if (zip) urlV1.searchParams.set('zip', zip);

      if (enableLog) console.log(`→ [RedSky v1] Fetching: ${urlV1.toString()}`);
      res = await fetch(urlV1.toString(), { headers: { 'User-Agent': USER_AGENT } });
    }

    if (!res.ok) {
      const txt = await res.text();
      console.warn(`⚠️ RedSky fetch failed for store ${storeId} (status ${res.status}): ${txt.slice(0, 150)}`);
      break;
    }

    const json = await res.json();
    const batch = json.data?.search?.products || [];
    if (enableLog) console.log(`   → batch returned ${batch.length} items`);
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < limit) break;
    await new Promise(r => setTimeout(r, 300)); // Rate limit delay
  }
  return all;
}

(async () => {
  // Load all target_stores via pagination
  console.log('📦 Loading target_stores from Supabase...');
  async function getAllStores() {
    const all = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await sb
        .from('target_stores')
        .select('store_id, zip')
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
    }
    return all;
  }
  let stores;
  try {
    stores = await getAllStores();
  } catch (e) {
    console.error('❌ Failed to load stores:', e.message);
    process.exit(1);
  }
  console.log(`→ ${stores.length} stores fetched.`);

  // Generate a visitor ID for this run
  const visitorId = crypto.randomUUID();
  console.log(`🔑 Generated visitorId: ${visitorId}`);

  const args = process.argv.slice(2);
  const debugIds = args.filter((a) => /^\d+$/.test(a)).map(Number);
  const enableLog = args.includes('--show');
  if (debugIds.length) {
    stores = stores.filter((s) => debugIds.includes(Number(s.store_id)));
    console.log(`→ Debug mode: processing only stores [${debugIds.join(', ')}]`);
  }
  console.log(`→ Stores remaining after filtering: [${stores.map(s => s.store_id).join(', ')}]`);

  const now = new Date();
  const captured_date = now.toISOString().split('T')[0];
  const captured_at = now.toISOString();

  for (const { store_id, zip } of stores) {
    console.log(`\n===== Processing store ${store_id} =====`);
    const results = await fetchEggsFromRedSky(store_id, zip, visitorId, enableLog);
    console.log(`→ [RedSky] total items for store ${store_id}: ${results.length}`);

    const buckets = { regular: [], organic: [] };
    const debugByType = { regular: [], organic: [] };
    for (const prod of results) {
      const title = prod.item?.product_description?.title || prod.title;
      const type = classifyEggProduct(title);
      if (!type) continue;
      let price = null;
      if (prod.price?.current_retail) price = prod.price.current_retail;
      else if (prod.price?.current_retail_price) price = prod.price.current_retail_price;
      if (price != null && price > 0) {
        buckets[type].push(price);
        debugByType[type].push({ tcin: prod.tcin, title, price });
      }
    }
    if (debugByType.regular.length) {
      console.log(`→ Regular 12-pack eggs for store ${store_id}:`);
      console.table(debugByType.regular);
    }
    if (debugByType.organic.length) {
      console.log(`→ Organic 12-pack eggs for store ${store_id}:`);
      console.table(debugByType.organic);
    }

    const payload = [];
    for (const type of ['regular', 'organic']) {
      const arr = buckets[type];
      if (!arr.length) {
        console.warn(`⚠️ No ${type} egg prices for store ${store_id}`);
        payload.push({ store_id, product_type: type, captured_date, captured_at, min_price: null, avg_price: null, max_price: null });
      } else {
        const sum = arr.reduce((a, b) => a + b, 0);
        payload.push({
          store_id,
          product_type: type,
          captured_date,
          captured_at,
          min_price: Math.min(...arr),
          avg_price: Number((sum / arr.length).toFixed(2)),
          max_price: Math.max(...arr)
        });
      }
    }
    console.table(payload);
    const { error: upErr } = await sb
      .from('target_egg_price_stats')
      .upsert(payload, { onConflict: ['store_id', 'product_type', 'captured_date'] });
    if (upErr) console.error(`❌ Upsert failed for store ${store_id}:`, upErr.message);
    else console.log('✅ Upsert successful');

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n🏁 All stores processed.');
  process.exit(0);
})();
