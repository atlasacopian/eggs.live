/**
 * Erewhon egg prices, pulled directly from their own storefront's Algolia
 * search index (one index per physical store, e.g. GROVE_SEARCH_INDEX). No
 * bot-wall on this endpoint (unlike Target's RedSky) - confirmed with a
 * plain HTTP call, no browser needed.
 *
 * Classification mirrors fetch-kroger-egg-prices.js /
 * fetch-target-egg-prices-intercept.js: 12-count cartons only, organic vs
 * regular split, same excluded non-carton categories (liquid, hard-cooked,
 * etc.) plus Erewhon-specific ones (duck eggs, egg whites) that showed up in
 * their "eggs" search results.
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

const ALGOLIA_APP_ID = 'Y98RSJCJDH';
const ALGOLIA_API_KEY = '107758089d485c894f7205d715457357';

const EXCLUDE_WORDS = ['egg white', 'liquid', 'hard-cooked', 'hard cooked', 'boiled', 'duck', 'scramble', 'quesadilla', 'bites'];

// Erewhon's dozen-carton inventory is essentially all-organic; the one
// exception ("Non-GMO Corn & Soy Free Pasture Raised Medium Eggs") is itself
// a premium item, not a real "regular/conventional" carton the way Kroger or
// Target stock one - so it's excluded rather than tracked as regular. We
// don't poll for a "regular" category here at all.
function classifyEgg(hit) {
  if (hit.SubCategory !== 'Eggs') return null;
  if (hit.Size !== '12 ct') return null;
  const name = (hit.ProductName || '').toLowerCase();
  if (EXCLUDE_WORDS.some((w) => name.includes(w))) return null;
  return (hit.Attributes || []).includes('Organic') ? 'organic' : null;
}

async function searchEggs(locationId) {
  const indexName = `${locationId}_SEARCH_INDEX`;
  const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${indexName}/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.24.0)%3B%20Browser`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-algolia-api-key': ALGOLIA_API_KEY,
      'x-algolia-application-id': ALGOLIA_APP_ID,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify({ query: 'eggs', hitsPerPage: 100 }),
  });
  if (!res.ok) {
    throw new Error(`Algolia query failed for ${indexName}: ${res.status}`);
  }
  const json = await res.json();
  return json.hits || [];
}

function aggregate(prices) {
  if (!prices.length) return { min: null, avg: null, max: null };
  return {
    min: Math.min(...prices),
    avg: Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)),
    max: Math.max(...prices),
  };
}

(async () => {
  try {
    const { data: stores, error: storesErr } = await sb.from('erewhon_stores').select('location_id, name');
    if (storesErr) throw storesErr;
    if (!stores?.length) throw new Error('No Erewhon stores found - run scripts/seed-erewhon-stores.js first');

    // Erewhon is exclusively Southern California; captured_date reflects
    // Pacific calendar day, matching the Kroger fetcher's convention.
    const captured_date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    const captured_at = new Date().toISOString();

    const rows = [];
    for (const store of stores) {
      let hits;
      try {
        hits = await searchEggs(store.location_id);
      } catch (e) {
        console.warn(`⚠️ ${store.name}: ${e.message}`);
        rows.push({ location_id: store.location_id, captured_date, captured_at, status: 'FETCH_ERROR' });
        continue;
      }

      const buckets = { regular: [], organic: [] };
      for (const hit of hits) {
        const type = classifyEgg(hit);
        if (type && typeof hit.Price === 'number') buckets[type].push(hit.Price);
      }

      const reg = aggregate(buckets.regular);
      const org = aggregate(buckets.organic);
      rows.push({
        location_id: store.location_id,
        captured_date,
        captured_at,
        regular_min: reg.min,
        regular_avg: reg.avg,
        regular_max: reg.max,
        organic_min: org.min,
        organic_avg: org.avg,
        organic_max: org.max,
        status: 'OK',
      });
      console.log(`${store.name}: regular ${buckets.regular.length} SKUs (avg $${reg.avg}), organic ${buckets.organic.length} SKUs (avg $${org.avg})`);
      await new Promise((r) => setTimeout(r, 300));
    }

    const { error: upsertErr } = await sb.from('erewhon_egg_prices').upsert(rows, { onConflict: 'location_id,captured_date' });
    if (upsertErr) throw upsertErr;

    console.log(`✅ Upserted ${rows.length} Erewhon store-day rows`);
  } catch (e) {
    console.error('Erewhon egg price ingest error', e);
    process.exit(1);
  }
})();
