import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

// ---- env vars ----
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  KROGER_CLIENT_ID,
  KROGER_CLIENT_SECRET,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
  process.exit(1)
}
if (!KROGER_CLIENT_ID || !KROGER_CLIENT_SECRET) {
  console.error('❌  KROGER_CLIENT_ID and KROGER_CLIENT_SECRET must be set')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getToken() {
  const basic = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=product.compact',
  })
  if (!res.ok) {
    throw new Error(`Token request failed ${res.status}: ${await res.text()}`)
  }
  const { access_token } = await res.json()
  return access_token
}

async function fetchStoreIds() {
  const ids = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from('kroger_stores')
      .select('location_id')
      .order('location_id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data?.length) break
    ids.push(...data.map((r) => r.location_id))
    if (data.length < pageSize) break // last page
  }
  return ids
}

function isTwelveCount(text) {
  if (!text) return false
  const t = text.toLowerCase()
  if (/(18|24|30|36|48|60)[ ]?(ct|count)/.test(t)) return false // skip bigger packs
  return (
    /12[ ]?(ct|count)/.test(t) ||
    /1[ ]?dozen/.test(t) ||
    (t.includes('dozen') && !t.match(/(18|24|30|36|48|60)/))
  )
}

function isOrganic(text) {
  if (!text) return false
  return text.toLowerCase().includes('organic')
}

async function summarizeEggPrices(token, locationId) {
  const url = new URL('https://api.kroger.com/v1/products')
  url.searchParams.set('filter.term', 'eggs')
  url.searchParams.set('filter.locationId', locationId)
  url.searchParams.set('filter.limit', 100) // grab first 100 egg products (API max)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const { data } = await res.json()
  if (!data?.length) {
    console.log(`⏺ store ${locationId}: no products returned`)
  } else {
    console.log(`⏺ store ${locationId}: raw products = ${data.length}`)
  }

  const regPrices = []
  const orgPrices = []

  for (const p of data) {
    const desc = p.description ?? ''
    if (!isTwelveCount(desc)) continue // skip non-dozen sizes
    const item = p.items?.[0]
    let price = null
    if (item?.price) {
      price = item.price.promo ?? item.price.regular ?? null
    }
    if (!price) continue
    if (isOrganic(desc)) orgPrices.push(price)
    else regPrices.push(price)
  }
  console.log(`⏺ store ${locationId}: regular dozen = ${regPrices.length}, organic dozen = ${orgPrices.length}`)

  const calc = (arr, fn) => (arr.length ? fn(arr) : null)
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

  return {
    location_id: locationId,
    captured_at: new Date().toISOString(),
    regular_min: calc(regPrices, (x) => Math.min(...x)),
    regular_avg: calc(regPrices, avg),
    regular_max: calc(regPrices, (x) => Math.max(...x)),
    organic_min: calc(orgPrices, (x) => Math.min(...x)),
    organic_avg: calc(orgPrices, avg),
    organic_max: calc(orgPrices, (x) => Math.max(...x)),
  }
}

async function main() {
  console.time('egg-price-import')
  const token = await getToken()
  const storeIds = await fetchStoreIds()
  console.log(`📦 processing ${storeIds.length} stores`)

  const batch = []
  let processed = 0
  for (const loc of storeIds) {
    try {
      const row = await summarizeEggPrices(token, loc)
      if (row) batch.push(row)
    } catch (err) {
      console.warn('skip store', loc, err.message)
    }
    // bulk insert every 100 rows
    if (batch.length >= 100) {
      await sb.from('kroger_egg_prices').insert(batch)
      console.log(`↳ inserted ${batch.length} rows`)
      batch.length = 0
    }
    processed++
    if (processed % 100 === 0) {
      console.log(`… processed ${processed}/${storeIds.length}`)
    }
    await new Promise((r) => setTimeout(r, 120)) // throttle ~8 req/s
  }
  if (batch.length) {
    await sb.from('kroger_egg_prices').insert(batch)
    console.log(`↳ inserted ${batch.length} rows`)
  }
  console.timeEnd('egg-price-import')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
}) 