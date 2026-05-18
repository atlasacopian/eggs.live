import { supabaseServer } from '../../../lib/supabase'

// Helper function to get latest prices from an array of price records
function getLatestPrices(priceRecords, idField = 'store_id') {
    const priceMap = {};
    // Sort by date descending to process latest first
    priceRecords.sort((a, b) => new Date(b.captured_at) - new Date(a.captured_at));

    for (const priceRec of priceRecords) {
        const storeId = priceRec[idField];
        if (!priceMap[storeId]) {
            // Initialize with status if available in the first record encountered
            priceMap[storeId] = { regular_price: null, organic_price: null, updated_at: null, status: priceRec.status || null };
        }
        const priceDate = new Date(priceRec.captured_at);

        // Assign price if not already found (since we sorted by date desc)
        if (priceRec.product_type === 'regular' && priceMap[storeId].regular_price === null) {
            priceMap[storeId].regular_price = priceRec.avg_price;
        } else if (priceRec.product_type === 'organic' && priceMap[storeId].organic_price === null) {
            priceMap[storeId].organic_price = priceRec.avg_price;
      }

        // Track the latest date and potentially update status if this record is newer
        // and has a status (preferring status from the most recent record if multiple product_types exist for the same store)
        if (!priceMap[storeId].updated_at || priceDate > priceMap[storeId].updated_at) {
             priceMap[storeId].updated_at = priceDate;
             if (priceRec.status) { // Update status if this record is more recent and has a status
                priceMap[storeId].status = priceRec.status;
    }
        } else if (priceDate.getTime() === priceMap[storeId].updated_at.getTime() && priceRec.status && !priceMap[storeId].status) {
            // If same timestamp but current status is null, take this one
            priceMap[storeId].status = priceRec.status;
        }
    }
     // Convert date object back to ISO string
    Object.values(priceMap).forEach(p => {
      if (p.updated_at instanceof Date) {
        p.updated_at = p.updated_at.toISOString();
        }
    });
    return priceMap;
}

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


export async function GET(req) {
  console.log('--- EXECUTING LATEST STORES API V3 ---');
  console.log('📦 [api/stores] GET invoked with URL:', req.url);
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  console.log('📦 [api/stores] searchParams:', { zip, lat, lon });

  let latitude = lat
  let longitude = lon
  const radiusMiles = 3;
  const storeLimit = 20;

  // --- Geocoding ---
  if ((!latitude || !longitude) && zip) {
    try {
      const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`, { next:{ revalidate: 86400 } })
      if (geoRes.ok) {
        const geo = await geoRes.json()
        latitude = geo?.places?.[0]?.latitude
        longitude = geo?.places?.[0]?.longitude
        console.log(`Geocoded ${zip} to:`, { latitude, longitude });
      } else { console.warn(`Failed to geocode zip ${zip}. Status: ${geoRes.status}`); }
    } catch (e) { console.warn('Zip geocode failed', e) }
  }

  let sb;
  try {
    sb = supabaseServer();
  } catch (e) {
    console.warn('Supabase env vars missing – falling back to production API');
    try {
      const prodUrl = `https://eggs.live/api/stores?zip=${zip ?? ''}&lat=${lat ?? ''}&lon=${lon ?? ''}`;
      const prodRes = await fetch(prodUrl, { next: { revalidate: 60 } });
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        return Response.json(prodJson);
      }
      console.warn('Prod fallback failed, status', prodRes.status);
    } catch (err) {
      console.error('Prod fallback error', err);
    }
    return Response.json({ stores: [], lastUpdated: null, avgRegNat: null, avgRegNatDate: null, avgOrgNat: null, avgOrgNatDate: null });
  }
  let allStores = [];

  // --- Fetch and Process Kroger Data ---
  if (latitude && longitude) {
    console.log(`API_TEMP_DEBUG: Attempting Kroger RPC for lat=${latitude}, lon=${longitude}`);
    try {
      let { data: nearbyKrogerStores, error: krogerStoresError } = await sb.rpc('nearby_kroger_stores', {
        lat_in: parseFloat(latitude),
        lon_in: parseFloat(longitude),
          radius_miles: parseFloat(radiusMiles)
      });

      console.log('API_DEBUG_KROGER_RPC:', JSON.stringify(nearbyKrogerStores, null, 2)); // Log RPC output
      console.log('API_DEBUG_KROGER_RPC_ERROR:', JSON.stringify(krogerStoresError, null, 2)); // Log RPC error

      if (krogerStoresError) {
          console.error('API_TEMP_DEBUG: nearby_kroger_stores RPC ERROR:', JSON.stringify(krogerStoresError, null, 2));
      } else {
          console.log(`API_TEMP_DEBUG: nearby_kroger_stores RPC SUCCESS. Count: ${nearbyKrogerStores?.length}`);
          if (nearbyKrogerStores && nearbyKrogerStores.length > 0) {
              console.log('API_TEMP_DEBUG: First store from RPC:', JSON.stringify(nearbyKrogerStores[0], null, 2));
              // ---- Fetch latest Kroger price stats ----
              // 1) Determine latest captured_date in table
              const { data: latestRow, error: latestRowErr } = await sb
                .from('kroger_egg_prices_new')
                .select('captured_date')
                .order('captured_date', { ascending: false })
                .limit(1)
                .maybeSingle();
              const latestDate = latestRow?.captured_date;

              // Determine previous captured_date (for change % calculations)
              let prevDate = null;
              if (latestDate) {
                const { data: prevRow, error: prevRowErr } = await sb
                  .from('kroger_egg_prices_new')
                  .select('captured_date')
                  .lt('captured_date', latestDate)
                  .order('captured_date', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (prevRowErr) console.error('Error fetching previous Kroger captured_date', prevRowErr);
                prevDate = prevRow?.captured_date;
              }

              let priceRows = [];
              let prevPriceMap = {};
              if (latestDate) {
                const paddedIds = nearbyKrogerStores.map(s => String(s.store_id).trim().padStart(8,'0').slice(-8));
                const { data: priceData, error: priceErr } = await sb
                  .from('kroger_egg_prices_new')
                  .select('location_id, regular_avg, organic_avg, captured_at, status')
                  .eq('captured_date', latestDate)
                  .in('location_id', paddedIds);
                if (priceErr) console.error('Error fetching Kroger prices', priceErr);
                else priceRows = priceData;

                // Fetch previous day prices for change calculation
                if (prevDate) {
                  const { data: prevPriceData, error: prevPriceErr } = await sb
                    .from('kroger_egg_prices_new')
                    .select('location_id, regular_avg, organic_avg')
                    .eq('captured_date', prevDate)
                    .in('location_id', paddedIds);
                  if (prevPriceErr) console.error('Error fetching previous Kroger prices', prevPriceErr);
                  else {
                    // Merge into a map for quick look-up
                    prevPriceMap = Object.fromEntries(prevPriceData.map(r => [r.location_id, r]));
                  }
                }
              }

              const priceMap = Object.fromEntries(priceRows.map(r => [r.location_id, r]));
              
              const mappedKrogerStores = nearbyKrogerStores.map(store => {
                  const rawName = store.name || store.store_id;
                  let formattedName = rawName;
                  if (rawName.includes(' - ')) {
                    const [brand, branch] = rawName.split(' - ', 2);
                    formattedName = `${brand} (${branch})`;
                  } else if (/^Kroger - /.test(rawName)) {
                    const branch = rawName.replace(/^Kroger - /, '');
                    formattedName = `Kroger (${branch})`;
                  }

                  const locIdPadded = String(store.store_id).trim().padStart(8,'0').slice(-8);
                  const priceRec = priceMap[locIdPadded] || {};
                  const prevRec = prevPriceMap[locIdPadded] || {};

                  // Calculate percentage changes if previous record exists and has non-null prices
                  let regular_change = null, organic_change = null;
                  if (priceRec.regular_avg != null && prevRec.regular_avg != null && prevRec.regular_avg > 0) {
                    regular_change = ((priceRec.regular_avg - prevRec.regular_avg) / prevRec.regular_avg) * 100;
                  }
                  if (priceRec.organic_avg != null && prevRec.organic_avg != null && prevRec.organic_avg > 0) {
                    organic_change = ((priceRec.organic_avg - prevRec.organic_avg) / prevRec.organic_avg) * 100;
                  }

                  return {
                      name: formattedName,
                      address: store.address,
                      city: store.city,
                      state: store.state,
                      zip: store.zip,
                      regular_price: priceRec.regular_avg,
                      organic_price: priceRec.organic_avg,
                      regular_change,
                      organic_change,
                      distance: store.distance_miles,
                      updated_at: priceRec.captured_at,
                      brand: 'Kroger/Affiliate',
                      store_identifier: `K${store.store_id}`,
                      status: priceRec.status || 'NO_DATA_FOUND',
                      ...geoFromStoreRow(store),
                  };
              });
              allStores.push(...mappedKrogerStores);
              console.log(`API_TEMP_DEBUG: Pushed ${mappedKrogerStores.length} Kroger stores to allStores`);
          }
      }
    } catch (e) {
      console.error('API_TEMP_DEBUG: CRITICAL ERROR during Kroger RPC call or processing:', e);
    }
  } else {
      console.warn('API_TEMP_DEBUG: Skipping Kroger fetch due to missing coordinates.');
  }

  // --- Fetch and Process Target Data ---
  // /* --- Temporarily Comment Out Target ---
  if (latitude && longitude) {
    console.log(`✅ Calling RPC nearby_target_stores with: lat=${latitude}, lon=${longitude}, radius=${radiusMiles}`);
    let { data: nearbyTargetStores, error: targetStoresError } = await sb.rpc('nearby_target_stores', {
        lat_in: latitude, lon_in: longitude, radius_miles: radiusMiles
        });

    if (targetStoresError) {
        console.error('❌ Supabase RPC error (nearby_target_stores)', targetStoresError);
    } else if (nearbyTargetStores && nearbyTargetStores.length > 0) {
        console.log(`✅ Found ${nearbyTargetStores.length} nearby Target stores. IDs:`, nearbyTargetStores.map(s => s.store_id));
        const targetStoreIds = nearbyTargetStores.map(s => s.store_id);

        // Query target_egg_price_stats for these stores
        console.log(`🔄 Querying target_egg_price_stats for ${targetStoreIds.length} IDs...`);
        let { data: targetPrices, error: targetPricesError } = await sb
            .from('target_egg_price_stats')
            .select('store_id, product_type, avg_price, captured_at')
            .in('store_id', targetStoreIds);

        if (targetPricesError) {
            console.error('❌ Error fetching Target prices:', targetPricesError);
        } else if (targetPrices) {
             console.log(`✅ Fetched ${targetPrices.length} price records for Target stores.`);
             const priceMap = getLatestPrices(targetPrices, 'store_id');
             console.log('🗺️ Generated priceMap:', JSON.stringify(priceMap)); // Log the price map

             // Harmonize Target data
             const targetStoresData = await Promise.all(nearbyTargetStores.map(async store => {
                  const prices = priceMap[store.store_id] || {};
                  // Fetch last 2 regular prices
                  let { data: regularPrices, error: regErr } = await sb
                    .from('target_egg_price_stats')
                    .select('avg_price, captured_at')
                    .eq('store_id', store.store_id)
                    .eq('product_type', 'regular')
                    .order('captured_at', { ascending: false })
                    .limit(2);
                  // Fetch last 2 organic prices
                  let { data: organicPrices, error: orgErr } = await sb
                    .from('target_egg_price_stats')
                    .select('avg_price, captured_at')
                    .eq('store_id', store.store_id)
                    .eq('product_type', 'organic')
                    .order('captured_at', { ascending: false })
                    .limit(2);
                  let regular_change = null;
                  let organic_change = null;
                  if (regularPrices && regularPrices.length === 2 && regularPrices[1].avg_price) {
                    regular_change = ((regularPrices[0].avg_price - regularPrices[1].avg_price) / regularPrices[1].avg_price) * 100;
                }
                  if (organicPrices && organicPrices.length === 2 && organicPrices[1].avg_price) {
                    organic_change = ((organicPrices[0].avg_price - organicPrices[1].avg_price) / organicPrices[1].avg_price) * 100;
                  }
                  return {
                      name: `Target (${store.name || store.store_id})`,
                      address: store.address,
                      city: store.city,
                      state: store.state,
                      zip: store.zip,
                      regular_price: prices.regular_price,
                      organic_price: prices.organic_price,
                      regular_change,
                      organic_change,
                    distance: store.distance,
                      updated_at: prices.updated_at,
                    brand: 'Target',
                      store_identifier: `T${store.store_id}`,
                      ...geoFromStoreRow(store),
                  };
             }));
             allStores.push(...targetStoresData);
             console.log(`➕ Added ${targetStoresData.length} Target stores to results. Current allStores count: ${allStores.length}`);
        } else {
             console.log('❓ Fetched 0 price records for nearby Target stores.');
        }
    } else {
         console.log('❓ nearby_target_stores returned 0 stores.');
    }
  } else {
      console.warn('⏭️ Skipping Target fetch due to missing coordinates.');
  }
  // */ // --- End Target Comment Out ---

  // --- Combine, Sort, Limit ---
  console.log('🔄 Final processing. Current allStores count:', allStores.length);
  allStores.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  const finalStores = allStores.slice(0, storeLimit);
  console.log(`✅ Returning combined total of ${finalStores.length} stores.`);

  // --- Calculate Overall Last Updated ---
  const lastUpdated = finalStores.length > 0
    ? finalStores.reduce((maxTs, store) => {
        if (!store.updated_at) return maxTs;
        let currentMaxTs = (maxTs instanceof Date) ? maxTs : new Date(0);
        const currentStoreTs = new Date(store.updated_at);
        return currentStoreTs > currentMaxTs ? currentStoreTs : currentMaxTs;
      }, new Date(0)).toISOString()
    : null;
  console.log('Calculated overall lastUpdated:', lastUpdated);

  // --- Fetch National Averages ---
  let avgRegNat = null, avgRegNatDate = null, avgOrgNat = null, avgOrgNatDate = null;

  // Simplified FRED fetch logic
  try {
    const fredKey = process.env.FRED_API_KEY;
    if (fredKey) { 
      const regSeries = 'APU0000703111';
      let fredRes = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${regSeries}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`
      );
      let fredJson = await fredRes.json();
      if (fredRes.ok && !fredJson.error_code) {
        const obs = fredJson.observations?.[0];
        avgRegNat = obs?.value != null && obs.value !== '.' ? parseFloat(obs.value) : null;
        avgRegNatDate = obs?.date || null;
      } else {
        console.warn('FRED error:', fredJson.error_message || `Status ${fredRes.status}`);
      }
    }
    else { console.warn("FRED_API_KEY missing"); }
  } catch(err) { console.error("FRED Error", err); }
   
  // Simplified USDA fetch logic - use existing usda_weekly_egg_prices table
  try {
    const usdaKey = process.env.USDA_API_KEY;
    if (usdaKey) { 
      // Get the latest organic price from the existing USDA table
      const { data: usdaData, error: usdaError } = await sb
        .from('usda_weekly_egg_prices')
        .select('price, report_end_date')
        .eq('product_type', 'organic')
        .order('report_end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (usdaError) {
        console.error('Error fetching USDA average:', usdaError);
      } else if (usdaData) {
        avgOrgNat = usdaData.price;
        avgOrgNatDate = usdaData.report_end_date;
      }
    }
    else { console.warn("USDA_API_KEY missing"); }
  } catch(err) { console.error("USDA Error", err); }

  // --- Return Combined Data ---
  return Response.json({
    stores: finalStores,
    lastUpdated,
    // LA Averages are removed
    avgRegNat,
    avgRegNatDate,
    avgOrgNat,
    avgOrgNatDate
  });
}
