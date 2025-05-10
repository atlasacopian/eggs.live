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

  const sb = supabaseServer();
  let allStores = [];

  // --- Fetch and Process Kroger Data ---
  if (latitude && longitude) {
    console.log(`Calling RPC nearby_kroger_stores with: lat=${latitude}, lon=${longitude}`);
    let { data: nearbyKrogerStores, error: krogerStoresError } = await sb.rpc('nearby_kroger_stores', {
        lat_in: latitude, lon_in: longitude, radius_miles: radiusMiles
    });

    if (krogerStoresError) {
        console.error('Supabase RPC error (nearby_kroger_stores)', krogerStoresError);
    } else if (nearbyKrogerStores && nearbyKrogerStores.length > 0) {
        console.log(`Found ${nearbyKrogerStores.length} nearby Kroger stores.`);
        const krogerStoreIds = nearbyKrogerStores.map(s => s.store_id); // Assumes RPC returns 'store_id'

        // Query kroger_egg_prices_new for these stores
        let { data: krogerPrices, error: krogerPricesError } = await sb
            .from('kroger_egg_prices_new') // *** ADJUST if your Kroger price table name is different ***
            .select('location_id, product_type, avg_price, captured_at, status') // *** ADDED status HERE ***
            .in('location_id', krogerStoreIds); // *** ADJUST ID column if different ***

        if (krogerPricesError) {
            console.error('Error fetching Kroger prices:', krogerPricesError);
        } else if (krogerPrices) {
            console.log(`Fetched ${krogerPrices.length} price records for Kroger stores.`);
            const priceMap = getLatestPrices(krogerPrices, 'location_id'); // Pass ID field name

            // Harmonize Kroger data
            const krogerStoresData = nearbyKrogerStores.map(store => {
                 const prices = priceMap[store.store_id] || {};
                 return {
                     name: `${store.name || store.store_id}`, // Assuming name comes from RPC
                     address: store.address,
                     city: store.city,
                     state: store.state,
                     zip: store.zip,
                     regular_price: prices.regular_price,
                     organic_price: prices.organic_price,
                     distance: store.distance,
                     updated_at: prices.updated_at,
                     brand: 'Kroger/Affiliate', // Or derive from name if possible
                     store_identifier: `K${store.store_id}`,
                     status: prices.status // *** ADDED status HERE ***
                 };
            });
            allStores.push(...krogerStoresData);
            console.log(`Added ${krogerStoresData.length} Kroger stores to results.`);
        }
    } else {
        console.warn('Skipping Kroger fetch due to missing coordinates.');
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
             const targetStoresData = nearbyTargetStores.map(store => {
                  const prices = priceMap[store.store_id] || {};
                  return {
                      name: `Target (${store.name || store.store_id})`,
                      address: store.address,
                      city: store.city,
                      state: store.state,
                      zip: store.zip,
                      regular_price: prices.regular_price,
                      organic_price: prices.organic_price,
                      distance: store.distance,
                      updated_at: prices.updated_at,
                      brand: 'Target',
                      store_identifier: `T${store.store_id}`
                  };
             });
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
   
  // Simplified USDA fetch logic
  try {
    const usdaKey = process.env.USDA_API_KEY;
    if (usdaKey) { 
      // Placeholder: Add actual USDA MARS API logic here if needed, 
      // similar to the previous version, finding the Retail Egg report
      // and fetching the organic average.
      // For now, let's assume your scheduled script updates a 'national_averages' table
      const { data: usdaData, error: usdaError } = await sb
        .from('national_averages')
        .select('organic_price, date')
        .eq('source', 'USDA') // Assuming a 'source' column
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (usdaError) {
        console.error('Error fetching USDA average:', usdaError);
      } else if (usdaData) {
        avgOrgNat = usdaData.organic_price;
        avgOrgNatDate = usdaData.date;
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

}
