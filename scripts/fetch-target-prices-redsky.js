import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// ---- env vars ----
const { SUPABASE_URL, SUPABASE_SERVICE_KEY, REDSKY_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !REDSKY_KEY) {
  console.error('❌ SUPABASE_URL, SUPABASE_SERVICE_KEY, and REDSKY_KEY must all be set');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const KNOWN_EGG_TCINS = [
  '83719457', // Good & Gather 18ct Large White
  // add more TCINs here
];

async function getStoreIdsFromDb() {
  console.log('📚 Fetching store IDs from Supabase...');
  const { data: stores, error } = await sb
    .from('target_stores')
    .select('store_id, name, city, state')
    .order('state');
  if (error) {
    console.error('❌ Error fetching stores:', error);
    process.exit(1);
  }
  console.log(`  -> Found ${stores.length} stores.`);
  return stores;
}

async function fetchPricesFromRedSky(store) {
  console.log(`🔍 Fetching from RedSky API for store ${store.store_id}`);
  const url = `https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2` +
    `?key=${REDSKY_KEY}` +
    `&pricing_store_id=${store.store_id}` +
    `&keyword=egg` +
    `&channel=WEB` +
    `&count=100`;

  const { data } = await axios.get(url, { timeout: 30000 });
  const products = data.data.search?.products || [];
  const results = [];

  for (const p of products) {
    const tcin = p.tcin?.toString();
    if (!KNOWN_EGG_TCINS.includes(tcin)) continue;
    const name = p.item?.product_description?.title || '[No Title]';
    const priceVal = p.price?.current_retail;
    if (priceVal == null) continue;

    results.push({
      store_id: store.store_id,
      tcin,
      captured_at: new Date().toISOString(),
      captured_date: new Date().toISOString().split('T')[0],
      product_name: name,
      price: parseFloat(priceVal),
      price_type: 'regular',
      product_type: name.toLowerCase().includes('organic') ? 'organic' : 'regular',
      raw_json: p,
    });
  }

  console.log(`   -> Collected ${results.length} prices for store ${store.store_id}`);
  return results;
}

async function main() {
  console.time('target-price-fetch');
  const stores = await getStoreIdsFromDb();
  const allPrices = [];

  for (const store of stores) {
    const prices = await fetchPricesFromRedSky(store);
    allPrices.push(...prices);
  }

  if (allPrices.length === 0) {
    console.log('No prices fetched; exiting.');
    process.exit(0);
  }

  console.log(`💾 Upserting ${allPrices.length} rows to Supabase...`);
  const { error } = await sb
    .from('target_egg_prices')
    .upsert(allPrices, { onConflict: ['store_id', 'tcin', 'captured_date'] });
  if (error) {
    console.error('❌ Upsert failed:', error);
    process.exit(1);
  }

  console.timeEnd('target-price-fetch');
  console.log('✅ Done.');
  process.exit(0);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 