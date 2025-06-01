import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import fetch from 'node-fetch';
import pLimit from 'p-limit';
import { createClient } from '@supabase/supabase-js';
import Bottleneck from 'bottleneck';

// --- env ---
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  KROGER_CLIENT_ID,
  KROGER_CLIENT_SECRET
} = process.env;

// Add STORE_TABLE constant to allow using a reduced-size table
const STORE_TABLE = process.env.KROGER_STORES_TABLE || 'kroger_stores';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_URL & SUPABASE_SERVICE_KEY');
  process.exit(1);
}
if (!KROGER_CLIENT_ID || !KROGER_CLIENT_SECRET) {
  console.error('❌ Set KROGER_CLIENT_ID & KROGER_CLIENT_SECRET');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- token cache ---
let cachedToken = null;
let tokenExpires = 0;
async function getToken () {
  if (cachedToken && Date.now() < tokenExpires - 60_000) return cachedToken; // refresh 1 min before expiry
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'product.compact'
  });
  const res = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });
  if (!res.ok) {
    console.error('Token fetch response not OK:', res.status, await res.text().catch(() => 'Error reading token error text'));
    throw new Error(`Token error ${res.status}`);
  }
  const json = await res.json();
  console.log('Token API JSON response (first 100 chars):', JSON.stringify(json).slice(0, 100));
  if (!json.access_token) {
    console.error('No access_token in token API response:', json);
    throw new Error('Failed to retrieve access_token from Kroger API');
  }
  cachedToken = json.access_token;
  tokenExpires = Date.now() + json.expires_in * 1000;
  console.log('Retrieved token (first 10 chars):', cachedToken.slice(0,10));
  return cachedToken;
}

// regex helpers: shell eggs & 12-count
const RE_EGG = /(shell\s*)?egg(s)?/i;
const RE_TWELVE = /(12\s*(ct|pk|count|pack|dozen|doz)\b|\bdozen\b|\bdoz\b)/i;

// The classify function is removed as its logic is now integrated into fetchStoreEggs
/*
function classify (txt = '') {
  const t = txt.toLowerCase();
  if (!RE_EGG.test(t) || !RE_TWELVE.test(t)) return null;
  return /organic/.test(t) ? 'organic' : 'regular';
}
*/

// Kroger API requires an 8-character alphanumeric locationId. Trim/zero-pad any values coming from the DB
function normalizeLocationId(id) {
  const raw = String(id ?? '').trim();
  if (raw.length === 8) return raw;
  // If shorter, pad with leading zeros; if longer, truncate to last 8 chars
  return raw.length < 8 ? raw.padStart(8, '0') : raw.slice(-8);
}

let loggedFullProductForNullPrice = false; // Flag to ensure we only log one full product object

// --- helper: fetch with retry & exponential backoff (for 429 rate-limits & 5xx) ---
async function fetchWithRetry(url, options = {}, maxAttempts = 5) {
  let lastRes;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, options);
    lastRes = res;
    // Log rate-limit headers
    const remaining = res.headers.get('X-RateLimit-Remaining');
    const limit = res.headers.get('X-RateLimit-Limit');
    console.log(`fetchWithRetry: rate-limit ${remaining}/${limit}`);
    if (res.ok) return res; // success

    if (res.status === 429) {
      // Use Retry-After header if present
      const retryAfterHeader = res.headers.get('Retry-After');
      let retryAfterSec = parseInt(retryAfterHeader, 10);
      if (isNaN(retryAfterSec) || retryAfterSec <= 0) {
        // Fallback to exponential backoff capped at 60s
        retryAfterSec = Math.min(60, 5 * attempt);
      }
      console.warn(`fetchWithRetry: rate limit hit (429). Retry after ${retryAfterSec}s`);
      await new Promise(r => setTimeout(r, retryAfterSec * 1000));
      continue;
    }

    // Server errors (5xx)
    if (res.status >= 500 && res.status < 600) {
      const waitMs = 2000 * attempt;
      console.warn(`fetchWithRetry: server error ${res.status}. Retrying after ${waitMs}ms`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    // Other errors, break to return last response
    break;
  }
  return lastRes;
  }

// --- rate-limit configuration ---
// Requests-per-second and concurrency can be tuned via env. Defaults are safe for Kroger API.
const RATE_LIMIT_RPS = Number(process.env.RATE_LIMIT_RPS ?? '0.5'); // default to 0.5 requests per second
const MAX_CONCURRENT_REQUESTS = Number(process.env.MAX_CONCURRENT_REQUESTS ?? '6');
// Whether to randomize store processing order (helps avoid regional clusters of server errors)
const SHOULD_SHUFFLE_STORES = process.env.SHUFFLE_STORES === '1';
// Maximum number of consecutive stores that can be skipped (due to 5xx/429 errors)
// before aborting the entire run. Can be overridden via env MAX_CONSECUTIVE_SKIPS.
const MAX_CONSECUTIVE_SKIPS = Number(process.env.MAX_CONSECUTIVE_SKIPS ?? '100');

// Token-bucket / leaky-bucket limiter
const limiter = new Bottleneck({
  minTime: Math.ceil(1000 / RATE_LIMIT_RPS), // spacing between slots
  maxConcurrent: MAX_CONCURRENT_REQUESTS
});

// Helper to wrap fetchWithRetry in the limiter
function rateLimitedFetch (url, opts) {
  return limiter.schedule(() => fetchWithRetry(url, opts));
}

// Artificial delays are now optional and default to 0 (disabled)
const STORE_DELAY_MS = Number(process.env.STORE_DELAY_MS ?? '1000'); // default 1s
const PAGE_DELAY_MS  = Number(process.env.PAGE_DELAY_MS  ?? '1000'); // default 1s

class NonFatalSkipError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NonFatalSkipError';
  }
}

async function fetchStoreEggs (location_id_raw) {
  const location_id = normalizeLocationId(location_id_raw);
  const token = await getToken();

  console.log(`fetchStoreEggs: Using normalized location_id: ${location_id} (raw: ${location_id_raw})`);
  console.log(`fetchStoreEggs: Using token (first 10): ${token.slice(0,10)}, (last 10): ${token.slice(-10)}`);

  const base = new URL('https://api.kroger.com/v1/products');
  base.searchParams.set('filter.locationId', location_id);
  base.searchParams.set('filter.term', 'eggs');
  base.searchParams.set('filter.limit', '50');

  let offset = 0;
  const buckets = { regular: [], organic: [], _allMatched: [] };

  while (true) {
    // Clone base URL for current page fetch to ensure filter.start is managed cleanly
    const currentUrl = new URL(base);
    // Always set the offset for pagination
    currentUrl.searchParams.set('filter.offset', String(offset));

    console.log(`fetchStoreEggs: Attempting to fetch URL: ${currentUrl.toString()}`); // Log the exact URL

    const res = await rateLimitedFetch(currentUrl.toString(), {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json'
      }
    });
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`fetchStoreEggs: page not found (404) for store ${location_id} at offset ${offset}. Ending pagination.`);
        break;
      }
      const errorBodyText = await res.text().catch(() => `Failed to read error body for status ${res.status}`);
      // If Kroger returns an explicit "invalid parameters" error (store no longer valid)
      if (res.status === 400) {
        let errCode, errReason;
        try {
          const errJson = JSON.parse(errorBodyText);
          errCode = errJson?.errors?.code;
          errReason = errJson?.errors?.reason;
        } catch {}

        if (errCode === 'PRODUCT-4105-400' || /invalid parameters/i.test(errReason ?? '')) {
          console.warn(`fetchStoreEggs: Invalid parameters for store ${location_id} (code: ${errCode || 'N/A'}). Skipping store.`);
          return buckets; // Skip this store but do NOT abort entire run
        }
      }
      // Skip store on persistent 429 rate-limit (after retries already attempted)
      if (res.status === 429) {
        console.warn(`fetchStoreEggs: persistent rate-limit 429 for store ${location_id}. Skipping store.`);
        throw new NonFatalSkipError(`Persistent 429 for store ${location_id}`);
      }
      // Skip store on any 5xx after retries – treat as transient backend issue
      if (res.status >= 500 && res.status < 600) {
        let reason;
        try {
          const errJson = JSON.parse(errorBodyText);
          reason = errJson.errors?.reason;
        } catch {}
        console.warn(`fetchStoreEggs: server error ${res.status} for store ${location_id}. Reason: ${reason || 'N/A'}. Skipping store.`);
        throw new NonFatalSkipError(`Server error ${res.status} for store ${location_id}`);
      }
      // For all other errors, throw to abort the script
      throw new Error(`API call to ${currentUrl.toString()} failed for location ${location_id}. Status: ${res.status}. Response: ${errorBodyText.slice(0, 500)}`);
    }
    const json = await res.json();
    const products = json.data || [];

    // classify & collect prices
    for (const p of products) {
      // NEW mainDesc logic based on p.description being a string:
      let combinedName = '';
      if (typeof p.description === 'string' && p.description.trim() !== '') {
        combinedName = p.description.trim();
      } else if (typeof p.brand === 'string' && p.brand.trim() !== '') {
        // Fallback to brand if p.description isn't a useful string
        combinedName = p.brand.trim();
      }
      // combinedName is now our best attempt at a full name from either p.description or p.brand

      const itemSize = p.items?.[0]?.size?.toLowerCase() || ''; // Ensure it's a string, default to empty

      // More lenient egg product identification:
      // 1. Check for explicit "egg" keywords in description or size.
      let isEggKeywordPresent = RE_EGG.test(combinedName) || RE_EGG.test(itemSize);
      
      // 2. Check for 12-count packaging (ct, pk, doz, dozen - not generic units like oz).
      const isDozenPackaging = RE_TWELVE.test(combinedName) || RE_TWELVE.test(itemSize);

      // 3. Removed previously lenient fallback: we now require the presence of an explicit egg keyword.

      // Final decision: must have an egg keyword AND be dozen packaging.
      if (!isEggKeywordPresent || !isDozenPackaging) {
        // console.log(`fetchStoreEggs: SKIPPED (Store: ${location_id}, Size: ${itemSize || 'N/A'}, HasEggKeyword: ${isEggKeywordPresent}, IsDozenPkg: ${isDozenPackaging}): ${mainDesc.trim() || '[No main description]'}`); // Verbose: Removed for cleaner output
        continue;
      }

      const type = /organic/i.test(combinedName) ? 'organic' : 'regular'; // Organic check remains on mainDesc
      
      // Prefer the item entry that matches our current store/location ID
      let item = {};
      if (Array.isArray(p.items) && p.items.length) {
        // Attempt exact match on locationId (string comparison to be safe)
        item = p.items.find(it => String(it.locationId || '').padStart(8,'0').slice(-8) === location_id) || p.items[0];
      }

      // REVISED PRICE LOGIC:
      // Prioritize a positive promo price. If not available or zero, use a positive regular price.
      // If item.price.current exists, it could be considered, but typically regular/promo are key.
      let price = null;
      const regularPrice = item.price?.regular;
      const promoPrice = item.price?.promo;

      if (promoPrice && promoPrice > 0) {
        price = promoPrice;
      } else if (regularPrice && regularPrice > 0) {
        price = regularPrice;
      }
      // If a price was found (either promo or regular and > 0), it's now in 'price'.
      // If 'price' is still null here, it means neither positive promo nor positive regular price was found.
      // (No need for the extra price < 0.01 check here if we only assign positive prices above)

      // Determine price status for logging
      let priceStatusString;
      if (price !== null) {
        priceStatusString = String(price);
      } else {
        const stockLevel = item?.inventory?.stockLevel?.toUpperCase();
        if (stockLevel === 'OUT_OF_STOCK' || stockLevel === 'NONE') {
          priceStatusString = 'OUT_OF_STOCK';
        } else if (stockLevel === 'LOW') {
          // Consider if LOW stock + no price should be distinct or just PRICE_NOT_AVAILABLE
          priceStatusString = 'PRICE_NOT_AVAILABLE (LOW_STOCK)'; 
        } else if (stockLevel === 'HIGH' || stockLevel === 'MEDIUM'){
          priceStatusString = 'PRICE_NOT_AVAILABLE (IN_STOCK)';
        } else { // stockLevel is undefined or an unexpected value
          priceStatusString = 'PRICE_NOT_AVAILABLE (STOCK_UNKNOWN)';
        }
      }

      // Log details of matched products and their prices
      const displayDesc = combinedName.trim(); // Use the new combinedName
      console.log(`fetchStoreEggs: MATCHED (Store: ${location_id}, Type: ${type}, PriceInfo: ${priceStatusString}, Size: ${itemSize}): ${displayDesc.toLowerCase() || p.productId.toLowerCase() || '[no desc/id]'}`);

      if (price) buckets[type].push(price); // Only add to buckets if price is a valid number
      buckets._allMatched.push(p);
    }

    if (products.length < 50) break; // Last page if fewer than limit items returned
    // Advance offset for next page
    offset += 50;
    // Kroger API limit: The 'filter.offset' parameter must be less than 250.
    if (offset >= 250) break;
    if (PAGE_DELAY_MS > 0) {
    await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
    }
  }
  return buckets;
}

(async () => {
  loggedFullProductForNullPrice = false; // Reset flag at the start of main
  
  console.log('Fetching Kroger store locations from Supabase with pagination...');
  let allStoreIdsFromDB = [];
  let from = 0;
  const pageSize = 1000; // Fetch in chunks of this size
  let totalCount = null; // Initialize totalCount
  let pageNumber = 0;

  while (true) {
    pageNumber++;
    console.log(`Fetching page ${pageNumber} of stores (from: ${from}, to: ${from + pageSize - 1})...`);
    const { data: storePage, error, count } = await sb
      .from(STORE_TABLE)
      .select('location_id', { count: 'exact' }) 
      .order('location_id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`Error fetching page ${pageNumber} of Kroger stores:`, error);
      throw error; // Critical error, stop the script
    }

    if (count !== null && totalCount === null) { // Set totalCount from the first successful query
      totalCount = count;
      console.log(`Total potential stores in ${STORE_TABLE} table: ${totalCount}`);
    }

    if (!storePage || storePage.length === 0) {
      console.log('No more stores found on this page. Concluding store fetch.');
      break; // No more stores to fetch
    }

    allStoreIdsFromDB.push(...storePage);
    console.log(`Fetched ${storePage.length} stores on page ${pageNumber}. Total fetched so far: ${allStoreIdsFromDB.length}`);

    if (storePage.length < pageSize) {
      console.log('Last page of stores fetched.');
      break; // Last page fetched
    }

    from += pageSize;
    await new Promise(r => setTimeout(r, 200)); // Small delay between page fetches if needed
  }

  const stores = allStoreIdsFromDB; // Use the fully populated list

  // console.log(`Retrieved ${stores.length} store locations from Supabase. Total potential count from query: ${count}`); - Old log, count might be from last page
  console.log(`Retrieved ${stores.length} store locations from Supabase (after pagination). Total expected: ${totalCount ?? 'N/A'}`);
  if (stores.length > 0) {
    console.log('First 5 store IDs to process:', stores.slice(0, 5).map(s => s.location_id));
    console.log('Last 5 store IDs to process:', stores.slice(-5).map(s => s.location_id));
  }
  const laStoreIdsToCheck = ['70400770', '70300032', '70300022', '70400375']; // From your RPC test
  let allLaStoresInList = true;
  laStoreIdsToCheck.forEach(id => {
      const normalizedIdToCheck = normalizeLocationId(id); // Normalize the ID we are looking for
      if (stores.some(s => normalizeLocationId(s.location_id) === normalizedIdToCheck)) {
          console.log(`LA Store ID ${id} (normalized: ${normalizedIdToCheck}) IS IN THE LIST to be processed.`);
      } else {
          console.error(`LA Store ID ${id} (normalized: ${normalizedIdToCheck}) IS NOT IN THE LIST to be processed.`);
          allLaStoresInList = false;
      }
  });
  if (allLaStoresInList) {
    console.log('All specified LA stores are present in the initial list.');
  } else {
    console.error('One or more specified LA stores are MISSING from the initial list.');
  }
  if (totalCount && stores.length < totalCount) {
    console.warn(`WARNING: Supabase query retrieved ${stores.length} stores, but the table potentially has ${totalCount} stores according to the initial count. This might indicate an issue if not all pages were fetched, or if the .limit() was still effectively lower than expected despite pagination logic.`);
  }
  if (stores.length === 0) {
    console.log('No stores found to process. Exiting.');
    process.exit(0);
  }

  // Apply START_AT and END_AT range limits if provided via env.
  const startAtEnv = Number(process.env.START_AT ?? '0');
  const endAtEnv = Number(process.env.END_AT ?? stores.length);
  const startIdx = isNaN(startAtEnv) ? 0 : Math.max(0, startAtEnv);
  let endIdxExclusive = isNaN(endAtEnv) ? stores.length : Math.min(stores.length, endAtEnv);

  // Optional: MAX_STORES_PER_RUN lets us cap the number of stores handled in one execution
  // regardless of the START/END range (handy for staying under daily API quotas).
  const maxStoresPerRun = Number(process.env.MAX_STORES_PER_RUN ?? '0');
  if (maxStoresPerRun > 0) {
    endIdxExclusive = Math.min(endIdxExclusive, startIdx + maxStoresPerRun);
  }

  const storesToProcess = stores.slice(startIdx, endIdxExclusive);

  // If enabled, shuffle store order to reduce the chance of hitting many failing stores back-to-back
  if (SHOULD_SHUFFLE_STORES) {
    console.log('Shuffling store order before processing to avoid regional error clusters.');
    for (let i = storesToProcess.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [storesToProcess[i], storesToProcess[j]] = [storesToProcess[j], storesToProcess[i]];
    }
  }

  console.log(`Processing ${storesToProcess.length} Kroger stores (indexes ${startIdx} – ${endIdxExclusive - 1})`);

  const concurrency = Number(process.env.CONCURRENCY ?? '1');
  console.log(`Using concurrency limit: ${concurrency}`);
  const limit = pLimit(concurrency);
  const now = new Date();
  // Derive the current calendar date in Los Angeles without complex Date reconstruction
  const captured_date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const captured_at = now.toISOString(); // keep actual UTC timestamp for captured_at
  const rows = [];
  const BATCH_SIZE = 20; // Upsert to Supabase in batches of this many stores

  let consecutiveSkipCount = 0;
  const skippedStores = [];

  await Promise.all(storesToProcess.map(async (s, idx) => limit(async () => {
    const index = startIdx + idx; // original index for logging
    const normalizedCurrentStoreId = normalizeLocationId(s.location_id);
    if (laStoreIdsToCheck.map(id => normalizeLocationId(id)).includes(normalizedCurrentStoreId)) {
        console.log(`DEBUG: Attempting to process LA store: ${s.location_id} (Normalized: ${normalizedCurrentStoreId})`);
    }
    try {
      const buckets = await fetchStoreEggs(s.location_id);
      const normalizedId = (String(s.location_id)).trim().padStart(8,'0').slice(-8);
      const regArr = buckets.regular;
      const orgArr = buckets.organic;

      // New: Track all matched 12-count egg products (regardless of price)
      let allMatchedProducts = [];
      // We'll need to refactor fetchStoreEggs to return all matched products, not just prices
      // For now, let's assume we can get this info (see below for fetchStoreEggs update)
      if (buckets._allMatched) {
        allMatchedProducts = buckets._allMatched;
      }

      let status;
      const hasReg = regArr.length > 0;
      const hasOrg = orgArr.length > 0;
      if (!hasReg && !hasOrg) {
        // If we have info on all matched products, check if all are out of stock
        if (allMatchedProducts.length > 0 && allMatchedProducts.every(p => {
          const stockLevel = p.items?.[0]?.inventory?.stockLevel?.toUpperCase();
          return stockLevel === 'OUT_OF_STOCK' || stockLevel === 'NONE';
        })) {
          status = 'OUT_OF_STOCK';
        } else if (allMatchedProducts.length === 0) {
          status = 'NO_DATA_FOUND';
        } else {
          status = 'NO_PRICED_DOZENS'; // fallback, should not hit
        }
      } else {
        status = 'OK';
      }

      const summary = {
        location_id: normalizedId,
        captured_date,
        captured_at,
        status,
        regular_min: hasReg ? Math.min(...regArr) : null,
        regular_avg: hasReg ? Number((regArr.reduce((a,b)=>a+b,0)/regArr.length).toFixed(2)) : null,
        regular_max: hasReg ? Math.max(...regArr) : null,
        organic_min: hasOrg ? Math.min(...orgArr) : null,
        organic_avg: hasOrg ? Number((orgArr.reduce((a,b)=>a+b,0)/orgArr.length).toFixed(2)) : null,
        organic_max: hasOrg ? Math.max(...orgArr) : null,
      };
      rows.push(summary);
      // ADDED LOGS START
      if (laStoreIdsToCheck.map(id => normalizeLocationId(id)).includes(normalizedId)) {
        console.log(`DEBUG: Successfully processed LA store ${s.location_id} (Normalized: ${normalizedId}), Status: ${status}, Summary for upsert:`, JSON.stringify(summary));
      }
      // ADDED LOGS END
      // verbose per-store summary
      console.log(` Store ${s.location_id}:`,
        'reg', buckets.regular.length ? `${Math.min(...buckets.regular)}-${Math.max(...buckets.regular)}` : '–',
        'org', buckets.organic.length ? `${Math.min(...buckets.organic)}-${Math.max(...buckets.organic)}` : '–');
      console.log(`✓ ${s.location_id} (${index + 1}/${storesToProcess.length})`);

      // If batch is full or it's the last item, upsert
      if (rows.length >= BATCH_SIZE || index === storesToProcess.length - 1) {
        if (rows.length > 0) { // Ensure there's something to upsert
          console.log(`Upserting batch of ${rows.length} rows to Supabase...`);
          const { error: batchUpErr } = await sb
            .from('kroger_egg_prices_new')
            .upsert(rows, { onConflict: 'location_id,captured_date' });
          if (batchUpErr) {
            console.error('Supabase batch upsert error:', batchUpErr);
          } else {
            console.log(`Batch upsert successful for ${rows.length} rows.`);
          }
          rows.length = 0; // Clear the rows array for the next batch
        }
      }

      // success resets skip streak
      consecutiveSkipCount = 0;

      // Add a delay after processing each store (or its failure) to reduce overall request rate
      if (STORE_DELAY_MS > 0) {
        await new Promise(r => setTimeout(r, STORE_DELAY_MS));
      }
    } catch (err) {
      if (err instanceof NonFatalSkipError) {
        consecutiveSkipCount++;
        skippedStores.push({ id: s.location_id, reason: err.message });
        console.warn(`Non-fatal skip (${consecutiveSkipCount} in a row): ${err.message}`);
        if (consecutiveSkipCount >= MAX_CONSECUTIVE_SKIPS) {
          console.error(`❌ Reached ${consecutiveSkipCount} consecutive skipped stores (limit: ${MAX_CONSECUTIVE_SKIPS}). Aborting run.`);
          throw err; // escalate to abort
        }
        return; // skip processing but continue
      }
      console.error(`Error processing store ${s.location_id}:`, err);
      throw err;
    }
  })));

  console.log('✅ All stores processed.');

  // Upsert placeholder rows for skipped stores so charts still have 1 row per store
  if (skippedStores.length) {
    console.log(`Inserting placeholder rows for ${skippedStores.length} skipped stores…`);
    const placeholderRows = skippedStores.map(s => ({
      location_id: (String(s.id)).trim().padStart(8,'0').slice(-8),
      captured_date,
      captured_at,
      status: 'SKIPPED',
      regular_min: null,
      regular_avg: null,
      regular_max: null,
      organic_min: null,
      organic_avg: null,
      organic_max: null,
    }));
    try {
      const { error: skipUpErr } = await sb
        .from('kroger_egg_prices_new')
        .upsert(placeholderRows, { onConflict: 'location_id,captured_date' });
      if (skipUpErr) console.error('Upsert skipped placeholder rows error:', skipUpErr);
    } catch(e) { console.error('Crash upserting skipped placeholders', e);}    
  }

  // (Retention cleanup removed – we keep historical rows for charts)
  process.exit(0);
})(); 