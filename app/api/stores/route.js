import { supabaseServer } from '@/lib/supabase'

export async function GET(req) {
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

  // Return the (potentially augmented) store data
  return Response.json({ stores: finalStores })
} 