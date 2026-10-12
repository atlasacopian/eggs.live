import { cache } from 'react'
import { supabaseServer } from './supabase'

/** Pass through lat/lon from Supabase RPC rows when present (for map UI). */
function geoFromStoreRow(store) {
  const lat =
    store.latitude ??
    store.lat ??
    store.location_lat ??
    store.lat_in;
  const lng =
    store.longitude ??
    store.lon ??
    store.lng ??
    store.location_lon ??
    store.lon_in;
  if (lat == null || lng == null) return {};
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return {};
  return { latitude: la, longitude: lo };
}

function pctChange(latest, prev) {
  if (latest == null || prev == null || prev === 0) return null;
  return ((latest - prev) / prev) * 100;
}

/** Nearest available value at or before ~7 days prior to the latest capture,
 *  for a week-over-week comparison. Now that prices reflect the true minimum
 *  SKU rather than a blended average, a raw day-over-day diff is usually
 *  exactly 0% - the cheapest carton's price just doesn't change that often.
 *  Comparing against ~a week back surfaces real movement instead. `rows`
 *  must be sorted newest-first by captured_date (all three fetchers already
 *  query in that order) so the first match found is the closest one, not
 *  just any older one. */
const CHANGE_WINDOW_DAYS = 7;
function weekAgoValue(rows, key, latestDateStr) {
  if (!latestDateStr) return null;
  const [y, m, d] = latestDateStr.split('-').map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1, d));
  cutoff.setUTCDate(cutoff.getUTCDate() - CHANGE_WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  for (const r of rows) {
    if (r.captured_date && r.captured_date <= cutoffStr && r[key] != null) {
      return r[key];
    }
  }
  return null;
}

/** Trimmed recent-price series (oldest→newest) for a small sparkline in the
 *  store list, built entirely from rows already fetched for the latest/change
 *  calculations above - no extra query, no fabricated data. */
function sparklineSeries(rows, key, points = 14) {
  const vals = [];
  for (const r of rows) {
    if (r[key] != null) vals.push(r[key]);
    if (vals.length >= points) break;
  }
  return vals.reverse();
}

/** Fetch and map nearby Kroger/affiliate stores, using each store's own latest
 *  real price rather than requiring every store to share one global "latest
 *  date" - the daily job runs in batches, so at any given moment plenty of
 *  stores simply haven't been reached yet for today even though they have
 *  perfectly good data from yesterday. */
async function fetchKrogerStores(sb, latitude, longitude, radiusMiles) {
  const { data: nearbyKrogerStores, error: krogerStoresError } = await sb.rpc('nearby_kroger_stores', {
    lat_in: parseFloat(latitude),
    lon_in: parseFloat(longitude),
    radius_miles: parseFloat(radiusMiles),
  });

  if (krogerStoresError) {
    console.error('nearby_kroger_stores RPC error:', krogerStoresError);
    return [];
  }
  if (!nearbyKrogerStores || nearbyKrogerStores.length === 0) return [];

  const paddedIds = nearbyKrogerStores.map(s => String(s.store_id).trim().padStart(8, '0').slice(-8));

  // 30 days is generous slack for a store missing an occasional day's batch
  // without risking PostgREST's 1000-row cap across ~20 nearby stores (this
  // isn't meant to survive a Target-style months-long outage - Kroger's
  // pipeline is healthy day-to-day).
  const lookback = new Date();
  lookback.setDate(lookback.getDate() - 30);
  const lookbackStr = lookback.toISOString().split('T')[0];

  const { data: rows, error: priceErr } = await sb
    .from('kroger_egg_prices')
    .select('location_id, regular_min, regular_avg, regular_max, organic_min, organic_avg, organic_max, captured_date, captured_at, status')
    .in('location_id', paddedIds)
    .gte('captured_date', lookbackStr)
    .order('captured_date', { ascending: false });
  if (priceErr) console.error('Error fetching Kroger prices', priceErr);

  const byStore = new Map();
  for (const r of rows || []) {
    if (!byStore.has(r.location_id)) byStore.set(r.location_id, []);
    byStore.get(r.location_id).push(r);
  }

  return nearbyKrogerStores.map(store => {
    const locIdPadded = String(store.store_id).trim().padStart(8, '0').slice(-8);
    return mapKrogerStore(store, byStore.get(locIdPadded) || []);
  });
}

/** Latest non-null value (and the date it came from) for one field, from a
 *  newest-first array. Uses captured_date (the scraper's own calendar-day
 *  label, computed in Pacific time for Kroger) rather than captured_at's
 *  UTC timestamp, so "how many days old" comparisons downstream aren't
 *  thrown off by the UTC/Pacific day-boundary mismatch. */
function latestNonNull(rows, key) {
  const found = rows.find(r => r[key] != null);
  return found ? { value: found[key], date: found.captured_date } : { value: null, date: null };
}

/** Average and highest dozen price from the same scrape as the displayed
 *  (cheapest) price, so all three numbers describe the same day's shelf. */
function priceSpread(rows, type) {
  const found = rows.find(r => r[`${type}_min`] != null);
  return {
    [`${type}_avg`]: found?.[`${type}_avg`] ?? null,
    [`${type}_max`]: found?.[`${type}_max`] ?? null,
  };
}

/** Kroger/affiliate store names come as "Banner - Branch" - reformat to
 *  "Banner (Branch)", matching how every other brand's name reads here. */
function formatKrogerName(rawName) {
  const name = rawName || '';
  if (name.includes(' - ')) {
    const [brand, branch] = name.split(' - ', 2);
    return `${brand} (${branch})`;
  }
  return name;
}

function mapKrogerStore(store, rows) {
  const rawName = store.name || store.store_id;
  const formattedName = formatKrogerName(rawName);

  const reg = latestNonNull(rows, 'regular_min');
  const org = latestNonNull(rows, 'organic_min');

  return {
    name: formattedName,
    address: store.address,
    city: store.city,
    state: store.state,
    zip: store.zip,
    regular_price: reg.value,
    organic_price: org.value,
    // Date each displayed price actually came from - only populated when that
    // specific product type has a value, so the UI can flag a stale price
    // even if the *other* product type updated today.
    regular_price_date: reg.date,
    organic_price_date: org.date,
    ...priceSpread(rows, 'regular'),
    ...priceSpread(rows, 'organic'),
    // Change % compares against ~a week ago rather than yesterday - see
    // weekAgoValue.
    regular_change: pctChange(reg.value, weekAgoValue(rows, 'regular_min', reg.date)),
    organic_change: pctChange(org.value, weekAgoValue(rows, 'organic_min', org.date)),
    regular_sparkline: sparklineSeries(rows, 'regular_min'),
    organic_sparkline: sparklineSeries(rows, 'organic_min'),
    distance: store.distance_miles,
    updated_at: rows[0]?.captured_at || null,
    brand: 'Kroger/Affiliate',
    store_identifier: `K${store.store_id}`,
    status: rows[0]?.status || 'NO_DATA_FOUND',
    ...geoFromStoreRow(store),
  };
}

/** Fetch and map nearby Target stores, using each store's own latest real
 *  price - same shape/pattern as fetchKrogerStores now that target_egg_prices
 *  matches kroger_egg_prices's layout (one row per store per day, regular/
 *  organic as columns - see database/015). */
async function fetchTargetStores(sb, latitude, longitude, radiusMiles) {
  const { data: nearbyTargetStores, error: targetStoresError } = await sb.rpc('nearby_target_stores', {
    lat_in: latitude, lon_in: longitude, radius_miles: radiusMiles,
  });

  if (targetStoresError) {
    console.error('nearby_target_stores RPC error', targetStoresError);
    return [];
  }
  if (!nearbyTargetStores || nearbyTargetStores.length === 0) return [];

  const ids = nearbyTargetStores.map(s => s.store_id);
  const lookback = new Date();
  lookback.setDate(lookback.getDate() - 30);
  const lookbackStr = lookback.toISOString().split('T')[0];

  const { data: rows, error: priceErr } = await sb
    .from('target_egg_prices')
    .select('location_id, regular_min, regular_avg, regular_max, organic_min, organic_avg, organic_max, captured_date, captured_at, status')
    .in('location_id', ids)
    .gte('captured_date', lookbackStr)
    .order('captured_date', { ascending: false });
  if (priceErr) console.error('Error fetching Target prices', priceErr);

  const byStore = new Map();
  for (const r of rows || []) {
    if (!byStore.has(r.location_id)) byStore.set(r.location_id, []);
    byStore.get(r.location_id).push(r);
  }

  return nearbyTargetStores.map(store => mapTargetStore(store, byStore.get(store.store_id) || []));
}

function mapTargetStore(store, rows) {
  const reg = latestNonNull(rows, 'regular_min');
  const org = latestNonNull(rows, 'organic_min');
  return {
    name: `Target (${store.name || store.store_id})`,
    address: store.address,
    city: store.city,
    state: store.state,
    zip: store.zip,
    regular_price: reg.value,
    organic_price: org.value,
    // Date each displayed price actually came from - only populated when that
    // specific product type has a value, so the UI can flag a stale price
    // even if the *other* product type updated today.
    regular_price_date: reg.date,
    organic_price_date: org.date,
    ...priceSpread(rows, 'regular'),
    ...priceSpread(rows, 'organic'),
    // Change % compares against ~a week ago rather than yesterday - see
    // weekAgoValue.
    regular_change: pctChange(reg.value, weekAgoValue(rows, 'regular_min', reg.date)),
    organic_change: pctChange(org.value, weekAgoValue(rows, 'organic_min', org.date)),
    regular_sparkline: sparklineSeries(rows, 'regular_min'),
    organic_sparkline: sparklineSeries(rows, 'organic_min'),
    distance: store.distance,
    updated_at: rows[0]?.captured_at || null,
    brand: 'Target',
    store_identifier: `T${store.store_id}`,
    status: rows[0]?.status || 'NO_DATA_FOUND',
    ...geoFromStoreRow(store),
  };
}

/** Fetch and map nearby Erewhon stores. Chain-wide pricing is uniform
 *  (verified across 5 geographically spread locations), but each store is
 *  still queried and stored separately so it appears in the local list like
 *  Kroger/Target, and in case pricing ever does diverge by location. */
async function fetchErewhonStores(sb, latitude, longitude, radiusMiles) {
  const { data: nearbyErewhonStores, error: erewhonStoresError } = await sb.rpc('nearby_erewhon_stores', {
    lat_in: latitude, lon_in: longitude, radius_miles: radiusMiles,
  });

  if (erewhonStoresError) {
    console.error('nearby_erewhon_stores RPC error', erewhonStoresError);
    return [];
  }
  if (!nearbyErewhonStores || nearbyErewhonStores.length === 0) return [];

  const priceResults = await Promise.all(nearbyErewhonStores.map(store =>
    sb.from('erewhon_egg_prices')
      .select('regular_min, regular_avg, regular_max, organic_min, organic_avg, organic_max, captured_date, captured_at, status')
      .eq('location_id', store.store_id)
      .order('captured_date', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (error) console.error(`Error fetching Erewhon prices for store ${store.store_id}:`, error);
        return data || [];
      })
  ));

  return nearbyErewhonStores.map((store, i) => mapErewhonStore(store, priceResults[i]));
}

function mapErewhonStore(store, rows) {
  const reg = latestNonNull(rows, 'regular_min');
  const org = latestNonNull(rows, 'organic_min');
  return {
    name: `Erewhon (${store.name})`,
    address: store.address,
    city: store.city,
    state: store.state,
    zip: store.zip,
    regular_price: reg.value,
    organic_price: org.value,
    regular_price_date: reg.date,
    organic_price_date: org.date,
    ...priceSpread(rows, 'regular'),
    ...priceSpread(rows, 'organic'),
    // Change % compares against ~a week ago rather than yesterday - see
    // weekAgoValue.
    regular_change: pctChange(reg.value, weekAgoValue(rows, 'regular_min', reg.date)),
    organic_change: pctChange(org.value, weekAgoValue(rows, 'organic_min', org.date)),
    regular_sparkline: sparklineSeries(rows, 'regular_min'),
    organic_sparkline: sparklineSeries(rows, 'organic_min'),
    distance: store.distance_miles,
    updated_at: rows[0]?.captured_at || null,
    brand: 'Erewhon',
    store_identifier: `E${store.store_id}`,
    status: rows[0]?.status || 'NO_DATA_FOUND',
    ...geoFromStoreRow(store),
  };
}

/** Fetch national average prices from FRED + USDA, independent of store data. */
async function fetchNationalAverages(sb) {
  let avgRegNat = null, avgRegNatDate = null, avgOrgNat = null, avgOrgNatDate = null;

  const [fredResult, usdaResult] = await Promise.all([
    (async () => {
      const fredKey = process.env.FRED_API_KEY;
      if (!fredKey) { console.warn('FRED_API_KEY missing'); return null; }
      try {
        const regSeries = 'APU0000703111';
        const fredRes = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=${regSeries}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`
        );
        const fredJson = await fredRes.json();
        if (fredRes.ok && !fredJson.error_code) {
          const obs = fredJson.observations?.[0];
          return {
            avgRegNat: obs?.value != null && obs.value !== '.' ? parseFloat(obs.value) : null,
            avgRegNatDate: obs?.date || null,
          };
        }
        console.warn('FRED error:', fredJson.error_message || `Status ${fredRes.status}`);
      } catch (err) {
        console.error('FRED Error', err);
      }
      return null;
    })(),
    (async () => {
      const usdaKey = process.env.USDA_API_KEY;
      if (!usdaKey) { console.warn('USDA_API_KEY missing'); return null; }
      try {
        const { data: usdaData, error: usdaError } = await sb
          .from('usda_weekly_egg_prices')
          .select('price, report_end_date')
          .eq('product_type', 'organic')
          .order('report_end_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (usdaError) {
          console.error('Error fetching USDA average:', usdaError);
          return null;
        }
        if (usdaData) return { avgOrgNat: usdaData.price, avgOrgNatDate: usdaData.report_end_date };
      } catch (err) {
        console.error('USDA Error', err);
      }
      return null;
    })(),
  ]);

  if (fredResult) { avgRegNat = fredResult.avgRegNat; avgRegNatDate = fredResult.avgRegNatDate; }
  if (usdaResult) { avgOrgNat = usdaResult.avgOrgNat; avgOrgNatDate = usdaResult.avgOrgNatDate; }

  return { avgRegNat, avgRegNatDate, avgOrgNat, avgOrgNatDate };
}

const RADIUS_STEPS = [3, 5, 10, 25];
const MIN_PRICED_STORES = 8;
const hasCurrentPrice = s => s.regular_price != null || s.organic_price != null;

/**
 * Core store-data fetch shared by the /api/stores route and the server-rendered
 * [zipCode] page, so the page can fetch this at render time instead of the
 * client waiting for hydration to finish before even starting the request.
 */
async function _getStoreData({ zip, lat, lon }) {
  let latitude = lat;
  let longitude = lon;
  const storeLimit = 20;

  if ((!latitude || !longitude) && zip) {
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`, { next: { revalidate: 86400 } });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        latitude = geo?.places?.[0]?.latitude;
        longitude = geo?.places?.[0]?.longitude;
      } else {
        console.warn(`Failed to geocode zip ${zip}. Status: ${geoRes.status}`);
      }
    } catch (e) {
      console.warn('Zip geocode failed', e);
    }
  }

  let sb;
  try {
    sb = supabaseServer();
  } catch (e) {
    console.warn('Supabase env vars missing – falling back to production API');
    try {
      const prodUrl = `https://eggs.live/api/stores?zip=${zip ?? ''}&lat=${lat ?? ''}&lon=${lon ?? ''}`;
      const prodRes = await fetch(prodUrl, { next: { revalidate: 60 } });
      if (prodRes.ok) return await prodRes.json();
      console.warn('Prod fallback failed, status', prodRes.status);
    } catch (err) {
      console.error('Prod fallback error', err);
    }
    return { stores: [], lastUpdated: null, avgRegNat: null, avgRegNatDate: null, avgOrgNat: null, avgOrgNatDate: null };
  }

  const hasCoords = Boolean(latitude && longitude);
  const nationalAveragesPromise = fetchNationalAverages(sb).catch(e => { console.error('National averages fetch failed:', e); return { avgRegNat: null, avgRegNatDate: null, avgOrgNat: null, avgOrgNatDate: null }; });

  const fetchWithin = async (radius) => {
    if (!hasCoords) return [];
    const [krogerStores, targetStores, erewhonStores] = await Promise.all([
      fetchKrogerStores(sb, latitude, longitude, radius).catch(e => { console.error('Kroger fetch failed:', e); return []; }),
      fetchTargetStores(sb, latitude, longitude, radius).catch(e => { console.error('Target fetch failed:', e); return []; }),
      fetchErewhonStores(sb, latitude, longitude, radius).catch(e => { console.error('Erewhon fetch failed:', e); return []; }),
    ]);
    return [...krogerStores, ...targetStores, ...erewhonStores]
      .filter(s => s.distance != null && s.distance <= radius)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  };

  // Dense metros have plenty of stores within 3mi, but a fixed 3mi radius
  // left plenty of zips (e.g. 90031) with only two or three stores - widen
  // step by step until there are enough stores with a current price to
  // compare, and report the radius actually used.
  let radiusMiles = RADIUS_STEPS[0];
  let allStores = [];
  for (const radius of RADIUS_STEPS) {
    radiusMiles = radius;
    allStores = await fetchWithin(radius);
    if (allStores.filter(hasCurrentPrice).length >= MIN_PRICED_STORES) break;
  }

  // Stores with a current price fill the list first; stores without one
  // (Target, whose prices are no longer collected) are kept but capped, so
  // they can't crowd real prices out of the list.
  const finalStores = [
    ...allStores.filter(hasCurrentPrice).slice(0, storeLimit),
    ...allStores.filter(s => !hasCurrentPrice(s)).slice(0, 10),
  ];
  const nationalAverages = await nationalAveragesPromise;

  const lastUpdated = finalStores.length > 0
    ? finalStores.reduce((maxTs, store) => {
        if (!store.updated_at) return maxTs;
        const currentMaxTs = (maxTs instanceof Date) ? maxTs : new Date(0);
        const currentStoreTs = new Date(store.updated_at);
        return currentStoreTs > currentMaxTs ? currentStoreTs : currentMaxTs;
      }, new Date(0)).toISOString()
    : null;

  return {
    stores: finalStores,
    radiusMiles,
    lastUpdated,
    ...nationalAverages,
  };
}

/**
 * Every store in a given state, not just stores within some radius of one
 * zip - powers the /state/[state] page reached from "Explore by State" on
 * the National view. Uses stores_by_state() (database/006), which already
 * picks each store's single latest price server-side, so this is a much
 * thinner mapping step than the per-zip radius fetch above (no 7-day
 * change %/sparkline here - those need each store's recent history, which
 * isn't worth pulling for what can be a thousand+ stores in one state).
 */
async function _getStoreDataByState(stateCode) {
  let sb;
  try {
    sb = supabaseServer();
  } catch (e) {
    console.warn('Supabase env vars missing – state store data unavailable');
    return { stores: [], state: stateCode };
  }

  const { data, error } = await sb.rpc('stores_by_state', { state_in: stateCode, lookback_days: 30 });
  if (error) {
    console.error('stores_by_state RPC error:', error);
    return { stores: [], state: stateCode };
  }

  const stores = (data || []).map(row => ({
    name: row.brand === 'Target' ? `Target (${row.name})`
      : row.brand === 'Erewhon' ? `Erewhon (${row.name})`
      : formatKrogerName(row.name),
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    regular_price: row.regular_price,
    organic_price: row.organic_price,
    regular_price_date: row.regular_price_date,
    organic_price_date: row.organic_price_date,
    brand: row.brand,
    store_identifier: `${row.brand[0]}${row.store_id}`,
    latitude: row.latitude,
    longitude: row.longitude,
  }));

  stores.sort((a, b) => (a.regular_price ?? Infinity) - (b.regular_price ?? Infinity));

  return { stores, state: stateCode };
}

// Wrapped in React's cache() so generateMetadata and the page component can
// both call getStoreData for the same request without hitting the DB twice -
// React dedupes calls with matching arguments within a single render pass.
export const getStoreData = cache(_getStoreData)
export const getStoreDataByState = cache(_getStoreDataByState)
