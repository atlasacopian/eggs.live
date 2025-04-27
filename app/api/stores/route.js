import { supabaseServer } from '@/lib/supabase'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const zip = searchParams.get('zip')
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    let latitude = lat
    let longitude = lon

    // If lat/lon missing but zip provided, fetch coordinates from free API
    if ((!latitude || !longitude) && zip) {
      try {
        const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`, { next:{ revalidate: 86400 } })
        if (geoRes.ok) {
          const geo = await geoRes.json()
          latitude = geo?.places?.[0]?.latitude
          longitude = geo?.places?.[0]?.longitude
          console.log(`Geocoded ${zip} to:`, { latitude, longitude });
        } else {
          console.warn(`Failed to geocode zip ${zip}. Status: ${geoRes.status}`);
        }
      } catch (e) {
        console.warn('Zip geocode failed', e)
      }
    }

    // Log the final coords being sent to RPC
    console.log(`Calling RPC with: zip=${zip}, lat=${latitude}, lon=${longitude}`);

    const sb = supabaseServer()

    // Call an RPC defined in Supabase that returns enriched records
    let { data: storesFromRpc, error: rpcError } = await sb.rpc('get_stores_with_prices', { zip_in: zip, lat_in: latitude, lon_in: longitude })

    if (rpcError) {
      console.error('Supabase RPC error', rpcError)
      // Fallback: pick first 10 stores matching zip
      const { data: fallbackData, error: fbErr } = await sb
        .from('stores')
        .select('name,address,zip_code')
        .eq('zip_code', zip)
        .limit(10)

      if (fbErr) {
        console.error('Supabase fallback error', fbErr)
        return Response.json({ error: fbErr.message }, { status: 500 })
      }
      storesFromRpc = fallbackData
    }

    let finalStores = storesFromRpc ?? [];

    // WORKAROUND: Fetch missing identifiers
    if (finalStores.length > 0) {
      // Get unique addresses from the RPC results
      const addresses = [...new Set(finalStores.map(s => s.address).filter(Boolean))];
      
      if (addresses.length > 0) {
        console.log('Attempting to fetch place_ids for addresses:', addresses);
        // Query the stores table to get place_id based on address
        const { data: idData, error: idError } = await sb
          .from('stores')
          .select('address, place_id')
          .in('address', addresses);

        if (idError) {
          console.warn('Could not fetch place_ids:', idError.message);
        } else if (idData) {
          // Create a map for easy lookup: address -> place_id
          const addressToIdMap = idData.reduce((map, item) => {
            map[item.address] = item.place_id;
            return map;
          }, {}); 

          console.log('Address to place_id map created:', addressToIdMap);

          // Add the store_identifier (place_id) to the original results
          finalStores = finalStores.map(store => ({
            ...store,
            store_identifier: addressToIdMap[store.address] || null // Add the ID from the map
          }));
        }
      }
    }
    // End of Workaround

    // Filter out Target stores for now since their prices are wrong
    const storesWithoutTarget = finalStores.filter(store => !/target/i.test(store.name || ''));
    // Determine the latest updated_at across all stores
    const lastUpdated = storesWithoutTarget.length > 0
      ? storesWithoutTarget.reduce((maxTs, store) => {
          const ts = store.updated_at || maxTs;
          return ts > maxTs ? ts : maxTs;
        }, storesWithoutTarget[0].updated_at)
      : null;
    // Fetch city‐wide LA averages from RPC
    const { data: laAvgsData, error: laAvgsError } = await sb.rpc('get_la_egg_price_averages');
    if (laAvgsError) console.warn('LA averages RPC error', laAvgsError.message);
    const laAvgs = laAvgsData && laAvgsData.length > 0 ? laAvgsData[0] : { avg_reg: null, avg_org: null };
    // Fetch national regular egg price from FRED (with fallback on default series)
    let avgRegNat = null;
    let avgRegNatDate = null;
    try {
      const fredKey = process.env.FRED_API_KEY;
      // Always use the standard conventional eggs series ID
      const regSeries = 'APU0000703111';
      console.log('Attempting FRED fetch for series:', regSeries);
      let fredRes = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${regSeries}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`
      );
      let fredJson = await fredRes.json();
      if (fredJson.error_code) {
        console.warn('FRED error:', fredJson.error_message, '- retrying default series APU0000703111');
        fredRes = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=${regSeries}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`
        );
        fredJson = await fredRes.json();
      }
      console.log('FRED raw response:', fredJson);
      const obs = fredJson.observations?.[0];
      avgRegNat = obs?.value != null ? parseFloat(obs.value) : null;
      avgRegNatDate = obs?.date || null;
    } catch (err) {
      console.warn('FRED fetch error', err.message);
    }
    // Fetch national organic average from USDA AMS Retail Egg Report API
    let avgOrgNat = null;
    let avgOrgNatDate = null;
    try {
      const usdaKey = process.env.USDA_API_KEY;
      console.log('USDA_API_KEY present:', !!usdaKey);
      // Include both original and descriptive USDA params for broad compatibility
      const params = new URLSearchParams({
        key: usdaKey,
        reportTitle: 'Retail Egg Report',   // Original param
        reportName: 'Retail Egg Report',    // Descriptive param
        commodity: 'Eggs',                  // Original param
        commodityDesc: 'EGGS',              // Descriptive param
        type: 'Organic',                    // Original param
        typeDesc: 'Organic',                // Descriptive param
        unit: 'Per Dozen',                  // Original param
        unitDesc: 'Per Dozen',              // Descriptive param
        region: 'National',                 // Original param
        market: 'NATIONAL',                 // Descriptive param
        frequency: 'Weekly',                // Original param
        frequencyDesc: 'Weekly',            // Descriptive param
        statisticCategory: 'Retail Price',  // Original param
        statisticCatDesc: 'Retail Price'    // Descriptive param
      });
      const usdaUrl = `https://api.ams.usda.gov/mn-api/v1/reports?${params.toString()}`;
      console.log('Fetching USDA REPORTS:', usdaUrl);
      const usdaRes = await fetch(usdaUrl);
      if (!usdaRes.ok) {
        console.error('USDA API error status:', usdaRes.status);
      } else {
        const usdaJson = await usdaRes.json();
        console.log('USDA raw API response:', usdaJson);
        const items = Array.isArray(usdaJson.data) ? usdaJson.data : [];
        // Filter and sort to get latest by reportDate or available date field
        const filtered = items
          .filter(r => r.pricePerUnit != null)
          .sort((a, b) => new Date(b.report_date || b.date) - new Date(a.report_date || a.date));
        const rec = filtered[0];
        console.log('Latest USDA organic record:', rec);
        if (rec) {
          // Fallback across possible field names for price
          const rawPrice = rec.pricePerUnit ?? rec.value ?? rec.avgPrice ?? rec.price;
          avgOrgNat = rawPrice != null ? parseFloat(rawPrice) : null;
          avgOrgNatDate = rec.report_date ?? rec.date;
        }
      }
    } catch (err) {
      console.error('USDA fetch error', err);
    }
    // If USDA organic average is still null, fallback to FRED series for organic eggs
    if (avgOrgNat == null) {
      try {
        const fredKey = process.env.FRED_API_KEY;
        const orgSeries = 'APU0000703121'; // FRED series for organic eggs
        console.log('Fallback FRED fetch for organic series:', orgSeries);
        const fredResOrg = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=${orgSeries}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`
        );
        const fredJsonOrg = await fredResOrg.json();
        const obsOrg = fredJsonOrg.observations?.[0];
        if (obsOrg?.value != null) {
          avgOrgNat = parseFloat(obsOrg.value);
          avgOrgNatDate = obsOrg.date;
          console.log('Fallback Organic FRED response:', avgOrgNat, avgOrgNatDate);
        }
      } catch (e) {
        console.warn('Organic FRED fallback error', e);
      }
    }
    // Return stores, lastUpdated, and all averages
    return Response.json({
      stores: storesWithoutTarget,
      lastUpdated,
      avgRegLA: laAvgs.avg_reg,
      avgOrgLA: laAvgs.avg_org,
      avgRegNat,
      avgRegNatDate,
      avgOrgNat,
      avgOrgNatDate
    });
  } catch (e) {
    console.error('Error in GET handler', e);
    return Response.json({ error: 'An error occurred' }, { status: 500 });
  }
} 