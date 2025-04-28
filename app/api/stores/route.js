import { supabaseServer } from '@/lib/supabase'

export async function GET(req) {
  console.log('📦 [api/stores] GET invoked with URL:', req.url);
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  console.log('📦 [api/stores] searchParams:', {
    zip: searchParams.get('zip'),
    lat: searchParams.get('lat'),
    lon: searchParams.get('lon')
  });

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
  let { data: storesFromRpc, error: rpcError } = await sb.rpc('get_kroger_store_prices', {
    zip_in: zip,
    lat_in: latitude,
    lon_in: longitude,
    radius_miles: 3,
    limit_n: 20
  });

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
    const credentials = Buffer.from(`${usdaKey}:`).toString('base64');
    // 1) Fetch list of available reports to find the Retail Egg Report slug
    const listUrl = 'https://marsapi.ams.usda.gov/services/v1.2/reports';
    const listRes = await fetch(listUrl, {
      headers: { 'Authorization': `Basic ${credentials}` },
      next: { revalidate: 86400 }
    });
    const listJson = await listRes.json();
    const reports = listJson.results || [];
    console.log('🚀 [api/stores] Total MARS reports count:', reports.length);
    // Log first 20 reports for inspection
    console.log('🚀 [api/stores] First 20 MARS report slugs:', reports.slice(0,20).map(r => ({ slug_id: r.slug_id, slug_name: r.slug_name, report_name: r.report_name })));
    // Find any report whose name mentions 'Egg' (case-insensitive)
    const eggReports = reports.filter(r => /egg/i.test(r.report_name));
    console.log('MARS candidate egg reports:', eggReports.map(r => ({ slug: r.slug_name, name: r.report_name })));  
    const retailReport = eggReports[0];
    if (!retailReport) {
      console.error('No Egg-related report found in MARS API reports list');
    }
    // Use slug_name to fetch filtered data
    const slug = retailReport?.slug_name;
    const filterQ = 'commodity=Eggs;type=Organic;unit=Per Dozen;region=National;frequency=Weekly;statisticCategory=Retail Price';
    const reportUrl = `https://marsapi.ams.usda.gov/services/v1.2/reports/${encodeURIComponent(slug)}?q=${encodeURIComponent(filterQ)}`;
    console.log('Fetching MARS report data:', reportUrl);
    const marsRes = await fetch(reportUrl, {
      headers: { 'Authorization': `Basic ${credentials}` },
      next: { revalidate: 3600 }
    });
    console.log('MARS fetch status:', marsRes.status, marsRes.statusText);
    const marsJson = await marsRes.json();
    console.log('MARS parsed JSON response:', marsJson);
    const results = Array.isArray(marsJson.results) ? marsJson.results : [];
    const latest = results[0] || {};
    avgOrgNat = latest.pricePerUnit != null ? parseFloat(latest.pricePerUnit) : null;
    avgOrgNatDate = latest.report_date || latest.published_date;
  } catch (err) {
    console.error('USDA fetch error', err);
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
} 