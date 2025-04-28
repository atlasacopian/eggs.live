import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

/*****************************************************
 * Simple one-shot importer:                         *
 *   1. set .env.local with                          *
 *        SUPABASE_URL, SUPABASE_SERVICE_KEY,        *
 *        KROGER_ACCESS_TOKEN (or client id/secret)  *
 *   2. run:  node scripts/import-kroger-locations.js *
 *****************************************************/

// ---- env ----
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  KROGER_ACCESS_TOKEN,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local')
  process.exit(1)
}
if (!KROGER_ACCESS_TOKEN) {
  console.error('❌  KROGER_ACCESS_TOKEN env var missing. Paste the token you obtained.')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fetchCircle(lat, lon) {
  const url = new URL('https://api.kroger.com/v1/locations')
  url.searchParams.set('filter.latLong.near', `${lat},${lon}`)
  url.searchParams.set('filter.radiusInMiles', 50)
  url.searchParams.set('filter.limit', 50)

  let page = 1,
    more = true,
    total = 1
  while (more) {
    url.searchParams.set('page[number]', page)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${KROGER_ACCESS_TOKEN}` },
    })
    if (!res.ok) {
      console.error(`Request failed ${res.status}: ${await res.text()}`)
      break
    }
    const json = await res.json()
    await upsert(json.data)
    const totalPages = Number(res.headers.get('pagination-total-pages') ?? 1)
    total = totalPages
    page++
    more = page <= total
  }
}

async function upsert(locations) {
  if (!locations?.length) return
  const rows = locations.map((l) => ({
    location_id: l.locationId,
    name: l.name,
    brand: l.chain,
    latitude: l.geolocation.latitude,
    longitude: l.geolocation.longitude,
    address1: l.address?.addressLine1 ?? null,
    city: l.address?.city ?? null,
    state: l.address?.state ?? null,
    zip: l.address?.zipCode ?? null,
    raw_json: l,
  }))
  await sb.from('kroger_stores').upsert(rows, {
    onConflict: 'location_id',
  })
  console.log(`↳ upserted ${rows.length} stores`)
}

async function main() {
  // Paginated fetch: 100 stores per page until exhausted
  console.time('kroger-store-import')
  let page = 1
  while (true) {
    const url = new URL('https://api.kroger.com/v1/locations')
    url.searchParams.set('filter.limit', 100)
    url.searchParams.set('page[number]', page)
    console.log(`📍 fetching page=${page}`)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${KROGER_ACCESS_TOKEN}` } })
    if (!res.ok) {
      console.error(`Request failed ${res.status}: ${await res.text()}`)
      break
    }
    const { data } = await res.json()
    if (!data?.length) break
    await upsert(data)
    console.log(`↳ upserted page ${page} (${data.length} stores)`)
    page++
  }
  console.timeEnd('kroger-store-import')
  process.exit(0)
}

main() 