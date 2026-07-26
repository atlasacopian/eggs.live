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

/** Split one store's price records by product_type, newest first, for quick latest/previous lookups. */
function splitByType(records) {
  const regular = records.filter(r => r.product_type === 'regular');
  const organic = records.filter(r => r.product_type === 'organic');
  regular.sort((a, b) => new Date(b.captured_at) - new Date(a.captured_at));
  organic.sort((a, b) => new Date(b.captured_at) - new Date(a.captured_at));
  return { regular, organic };
}

function pctChange(latest, prev) {
  if (latest == null || prev == null || prev === 0) return null;
  return ((latest - prev) / prev) * 100;
}

/** Latest and previous *non-null* price from a newest-first array (a scrape can record a null price on failure). */
function latestAndPrevPrice(arr) {
  const withPrice = arr.filter(r => r.avg_price != null);
  return { latest: withPrice[0] ?? null, prev: withPrice[1] ?? null };
}

/** Fetch and map nearby Kroger/affiliate stores with latest + previous-day prices. */
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

  const { data: latestRow } = await sb
    .from('kroger_egg_prices_new')
    .select('captured_date')
    .order('captured_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestDate = latestRow?.captured_date;
  if (!latestDate) {
    return nearbyKrogerStores.map(store => mapKrogerStore(store, {}, {}));
  }

  const { data: prevRow } = await sb
    .from('kroger_egg_prices_new')
    .select('captured_date')
    .lt('captured_date', latestDate)
    .order('captured_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  const prevDate = prevRow?.captured_date;

  const paddedIds = nearbyKrogerStores.map(s => String(s.store_id).trim().padStart(8, '0').slice(-8));

  const [{ data: priceData, error: priceErr }, prevPriceResult] = await Promise.all([
    sb.from('kroger_egg_prices_new')
      .select('location_id, regular_avg, organic_avg, captured_at, status')
      .eq('captured_date', latestDate)
      .in('location_id', paddedIds),
    prevDate
      ? sb.from('kroger_egg_prices_new')
          .select('location_id, regular_avg, organic_avg')
          .eq('captured_date', prevDate)
          .in('location_id', paddedIds)
      : Promise.resolve({ data: [] }),
  ]);
  if (priceErr) console.error('Error fetching Kroger prices', priceErr);

  const priceMap = Object.fromEntries((priceData || []).map(r => [r.location_id, r]));
  const prevPriceMap = Object.fromEntries((prevPriceResult.data || []).map(r => [r.location_id, r]));

  return nearbyKrogerStores.map(store => {
    const locIdPadded = String(store.store_id).trim().padStart(8, '0').slice(-8);
    return mapKrogerStore(store, priceMap[locIdPadded] || {}, prevPriceMap[locIdPadded] || {});
  });
}

function mapKrogerStore(store, priceRec, prevRec) {
  const rawName = store.name || store.store_id;
  let formattedName = rawName;
  if (rawName.includes(' - ')) {
    const [brand, branch] = rawName.split(' - ', 2);
    formattedName = `${brand} (${branch})`;
  } else if (/^Kroger - /.test(rawName)) {
    formattedName = `Kroger (${rawName.replace(/^Kroger - /, '')})`;
  }

  return {
    name: formattedName,
    address: store.address,
    city: store.city,
    state: store.state,
    zip: store.zip,
    regular_price: priceRec.regular_avg,
    organic_price: priceRec.organic_avg,
    // Date each displayed price actually came from - only populated when that
    // specific product type has a value, so the UI can flag a stale price
    // even if the *other* product type updated today.
    regular_price_date: priceRec.regular_avg != null ? priceRec.captured_at : null,
    organic_price_date: priceRec.organic_avg != null ? priceRec.captured_at : null,
    regular_change: pctChange(priceRec.regular_avg, prevRec.regular_avg),
    organic_change: pctChange(priceRec.organic_avg, prevRec.organic_avg),
    distance: store.distance_miles,
    updated_at: priceRec.captured_at,
    brand: 'Kroger/Affiliate',
    store_identifier: `K${store.store_id}`,
    status: priceRec.status || 'NO_DATA_FOUND',
    ...geoFromStoreRow(store),
  };
}

/** Fetch and map nearby Target stores with latest + previous prices, in a single bounded query. */
async function fetchTargetStores(sb, latitude, longitude, radiusMiles) {
  const { data: nearbyTargetStores, error: targetStoresError } = await sb.rpc('nearby_target_stores', {
    lat_in: latitude, lon_in: longitude, radius_miles: radiusMiles,
  });

  if (targetStoresError) {
    console.error('nearby_target_stores RPC error', targetStoresError);
    return [];
  }
  if (!nearbyTargetStores || nearbyTargetStores.length === 0) return [];

  // Supabase/PostgREST silently caps unbounded queries at 1000 rows with no
  // error. A single query spanning all nearby stores' full history (some
  // stores go months between successful scrapes, so we can't just take the
  // newest N rows overall - that starves stores with sparse recent data) can
  // exceed that cap and drop rows arbitrarily. Query each store separately
  // (each comfortably under the cap) but run them all concurrently.
  const priceResults = await Promise.all(nearbyTargetStores.map(store =>
    sb.from('target_egg_price_stats')
      .select('product_type, avg_price, captured_at')
      .eq('store_id', store.store_id)
      .order('captured_at', { ascending: false })
      .limit(1000)
      .then(({ data, error }) => {
        if (error) console.error(`Error fetching Target prices for store ${store.store_id}:`, error);
        return data || [];
      })
  ));

  return nearbyTargetStores.map((store, i) => {
    const { regular, organic } = splitByType(priceResults[i]);
    return mapTargetStore(store, regular, organic);
  });
}

function mapTargetStore(store, regArr, orgArr) {
  const reg = latestAndPrevPrice(regArr);
  const org = latestAndPrevPrice(orgArr);
  return {
    name: `Target (${store.name || store.store_id})`,
    address: store.address,
    city: store.city,
    state: store.state,
    zip: store.zip,
    regular_price: reg.latest?.avg_price ?? null,
    organic_price: org.latest?.avg_price ?? null,
    // Date of the actual non-null price shown above - can be much older than
    // today if this store's scrape has been failing (see latestAndPrevPrice).
    regular_price_date: reg.latest?.captured_at ?? null,
    organic_price_date: org.latest?.captured_at ?? null,
    // Change % compares the latest two captures positionally (not the latest
    // two non-null prices) to match this field's original semantics.
    regular_change: regArr.length >= 2 && regArr[1].avg_price ? pctChange(regArr[0].avg_price, regArr[1].avg_price) : null,
    organic_change: orgArr.length >= 2 && orgArr[1].avg_price ? pctChange(orgArr[0].avg_price, orgArr[1].avg_price) : null,
    distance: store.distance,
    updated_at: regArr[0]?.captured_at || orgArr[0]?.captured_at || null,
    brand: 'Target',
    store_identifier: `T${store.store_id}`,
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

/**
 * Core store-data fetch shared by the /api/stores route and the server-rendered
 * [zipCode] page, so the page can fetch this at render time instead of the
 * client waiting for hydration to finish before even starting the request.
 */
async function _getStoreData({ zip, lat, lon }) {
  let latitude = lat;
  let longitude = lon;
  const radiusMiles = 3;
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
  const [krogerStores, targetStores, nationalAverages] = await Promise.all([
    hasCoords ? fetchKrogerStores(sb, latitude, longitude, radiusMiles).catch(e => { console.error('Kroger fetch failed:', e); return []; }) : [],
    hasCoords ? fetchTargetStores(sb, latitude, longitude, radiusMiles).catch(e => { console.error('Target fetch failed:', e); return []; }) : [],
    fetchNationalAverages(sb).catch(e => { console.error('National averages fetch failed:', e); return { avgRegNat: null, avgRegNatDate: null, avgOrgNat: null, avgOrgNatDate: null }; }),
  ]);

  const allStores = [...krogerStores, ...targetStores]
    .filter(s => s.distance != null && s.distance <= radiusMiles);
  allStores.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  const finalStores = allStores.slice(0, storeLimit);

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
    lastUpdated,
    ...nationalAverages,
  };
}

// Wrapped in React's cache() so generateMetadata and the page component can
// both call getStoreData for the same request without hitting the DB twice -
// React dedupes calls with matching arguments within a single render pass.
export const getStoreData = cache(_getStoreData)
