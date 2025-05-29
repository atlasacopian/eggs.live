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
  KROGER_ACCESS_TOKEN: ENV_KROGER_ACCESS_TOKEN,
  KROGER_CLIENT_ID,
  KROGER_CLIENT_SECRET,
  KROGER_API_URL = 'https://api.kroger.com/v1', // default to production
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local')
  process.exit(1)
}

const API_BASE_URL = KROGER_API_URL
const STORE_TABLE = process.env.KROGER_STORES_TABLE || 'kroger_stores'
const STATE_FILTER = process.env.KROGER_STATE_FILTER ? process.env.KROGER_STATE_FILTER.split(',').map(s => s.trim().toUpperCase()) : null
const CITY_FILTER = process.env.KROGER_CITY_FILTER ? process.env.KROGER_CITY_FILTER.split(',').map(s => s.trim().toUpperCase()) : null

// Remove direct ENV reuse; we'll init properly
let accessToken

async function obtainNewAccessToken() {
  if (!KROGER_CLIENT_ID || !KROGER_CLIENT_SECRET) {
    console.error('❌  Missing Kroger client ID/secret. Please set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET in .env.local')
    process.exit(1)
  }
  console.log('🔑  Obtaining new Kroger access token using client credentials...')
  const basic = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64')
  const tokenUrl = `${API_BASE_URL}/connect/oauth2/token`
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: 'grant_type=client_credentials&scope=product.compact',
  })
  if (!res.ok) {
    console.error(`❌  Failed to obtain access token ${res.status}: ${await res.text()}`)
    process.exit(1)
  }
  const json = await res.json()
  accessToken = json.access_token
  console.log('✅  Obtained fresh access token.')
}

// Initialize the access token: prefer client credentials, fallback to ENV_KROGER_ACCESS_TOKEN
await (async function initAccessToken() {
  if (KROGER_CLIENT_ID && KROGER_CLIENT_SECRET) {
    await obtainNewAccessToken()
  } else if (ENV_KROGER_ACCESS_TOKEN) {
    accessToken = ENV_KROGER_ACCESS_TOKEN
  } else {
    console.error('❌  Provide either Kroger client credentials (KROGER_CLIENT_ID/KROGER_CLIENT_SECRET) or KROGER_ACCESS_TOKEN in .env.local')
    process.exit(1)
  }
})()

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Helper to deduplicate stores by location_id
const seenLocationIds = new Set()

async function upsert(locations) {
  if (!locations.length) return
  const rows = locations.map(l => ({
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
  const { error } = await sb.from(STORE_TABLE).upsert(rows, {
    onConflict: ['location_id'],
  })
  if (error) {
    console.error('❌  Supabase upsert failed:', error)
    process.exit(1)
  }
  console.log(`✅  Saved ${rows.length} locations (running total: ${seenLocationIds.size})`)
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchPagedLocations() {
  // Per-request page size: default 2900 or override via env
  const limit = Number(process.env.KROGER_PAGE_LIMIT ?? 2900)
  let start = 0
  while (true) {
    const url = new URL(`${API_BASE_URL}/locations`)
    url.searchParams.set('filter.limit', limit)
    url.searchParams.set('filter.start', start)
    console.log(`📡  Requesting locations limit=${limit} start=${start}`)

    let attempts = 0
    while (true) {
      attempts += 1
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (res.status === 401) {
        console.warn('🕑  Token expired. Refreshing and retrying…')
        await obtainNewAccessToken()
        continue
      }
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After') ?? 5)
        console.warn(`⚠️  Rate limited (429). Waiting ${retryAfter}s then retrying… (attempt ${attempts})`)
        await sleep(retryAfter * 1000)
        if (attempts <= 5) continue
      }
      if (!res.ok) {
        console.error(`❌  Failed to fetch locations ${res.status}: ${await res.text()}`)
        process.exit(1)
      }
      const json = await res.json()
      const locations = json.data || json.locations || []
      console.log(`   → received ${locations.length}`)

      let filtered = locations
      if (STATE_FILTER) {
        filtered = filtered.filter(loc => loc.address?.state && STATE_FILTER.includes(loc.address.state.toUpperCase()))
        console.log(`   → filtered by state, remaining ${filtered.length}`)
      }
      if (CITY_FILTER) {
        filtered = filtered.filter(loc => loc.address?.city && CITY_FILTER.includes(loc.address.city.toUpperCase()))
        console.log(`   → filtered by city, remaining ${filtered.length}`)
      }
      const newOnes = filtered.filter(loc => {
        if (seenLocationIds.has(loc.locationId)) return false
        seenLocationIds.add(loc.locationId)
        return true
      })
      await upsert(newOnes)

      if (locations.length < limit) {
        // last page
        return
      }
      start += limit
      await sleep(2000) // increased delay between pages
      break
    }
  }
}

async function main() {
  console.time('kroger-location-import')
  await fetchPagedLocations()
  console.timeEnd('kroger-location-import')
  console.log(`🏁  Import complete – total unique stores saved: ${seenLocationIds.size}`)
}

main()