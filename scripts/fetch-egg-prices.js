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

let currentToken

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

async function refreshToken() {
  currentToken = await getToken()
  return currentToken
}

// prime the token once (will refresh later on 401)
await refreshToken()

// utility sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Fetch with retry/back-off for 401/429
async function fetchWithRetry(url) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    let res = await fetch(url, { headers: { Authorization: `Bearer ${currentToken}` } })

    // token expired
    if (res.status === 401) {
      console.log('🔑 token expired, refreshing…')
      await refreshToken()
      res = await fetch(url, { headers: { Authorization: `Bearer ${currentToken}` } })
    }

    // rate limited
    if (res.status === 429) {
      const headerWait = Number(res.headers.get('Retry-After'))
      const waitSec = headerWait > 0 ? headerWait : Math.pow(2, attempt) // 2,4,8,16,32
      console.log(`⚠️  429 – waiting ${waitSec}s then retry (attempt ${attempt}/5) `)
      await sleep(waitSec * 1000)
      continue
    }

    return res // either ok or other error status handled by caller
  }
  return { ok: false, status: 429, text: async () => 'max retries' }
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

function isTwelveCountProduct(product) {
  const desc = (product.description ?? '').toLowerCase()
  const size = (product.items?.[0]?.size ?? '').toLowerCase()

  const check = (txt) => {
    if (!txt) return false
    if (/(18|24|30|36|48|60)[ ]?(ct|count)/.test(txt)) return false // skip bigger packs
    return (
      /12[ ]?(ct|count|pk|pack|pc|dz)/.test(txt) ||
      /1[ ]?(dozen|dz|doz)/.test(txt) ||
      /one[ ]?dozen/.test(txt) ||
      (txt.includes('dozen') && !txt.match(/(18|24|30|36|48|60)/))
    )
  }

  return check(desc) || check(size)
}

function isOrganic(product) {
  const desc = (product.description ?? '').toLowerCase()
  const size = (product.items?.[0]?.size ?? '').toLowerCase()
  const text = desc + ' ' + size
  // broadened keywords
  const keywords = ['organic', 'orgnc', 'org', 'o r g', 'o.r.g.']
  return keywords.some(k => text.includes(k))
}

async function fetchEggProducts(locationId) {
  const products = []
  const limit = 50 // API max
  const terms = [
    'eggs',
    'egg',
    'dozen eggs',
    '12 ct eggs',
    '12 count eggs',
    '1 dozen',
    'large eggs'
  ]
  for (const term of terms) {
    for (let start = 1; start <= 201; start += limit) { // up to 5 pages (250 items) per term
      const url = new URL('https://api.kroger.com/v1/products')
      url.searchParams.set('filter.term', term)
      url.searchParams.set('filter.locationId', locationId)
      url.searchParams.set('filter.limit', limit)
      url.searchParams.set('filter.start', start)
      // keep department filter off to capture all egg SKUs

      let res = await fetchWithRetry(url)
      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        console.log(`⏺ store ${locationId}: products request failed – ${res.status} ${errBody}`)
        break
      }
      const { data = [] } = await res.json()
      products.push(...data)
      await sleep(1500) // slower pace ~0.7 req/s
      if (data.length < limit) break // last page for this term
    }
  }
  // Deduplicate by productId/UPC
  const seen = new Set()
  const unique = []
  for (const p of products) {
    const id = p.productId || p.upc || p.description
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(p)
  }
  return unique // no cap, we already dedup
}

async function summarizeEggPrices(locationId) {
  const data = await fetchEggProducts(locationId)
  console.log(`⏺ store ${locationId}: raw products = ${data.length}`)

  const regPrices = []
  const orgPrices = []
  let foundDozen = false

  for (const p of data) {
    if (!isTwelveCountProduct(p)) continue // skip non-dozen sizes
    foundDozen = true
    let price = null
    for (const it of p.items ?? []) {
      const pr = it.price ?? {}
      const raw =
        pr.promo ??
        pr.regular ??
        pr.original ??
        pr.final ??
        pr.current ??
        pr.retail ??
        null
      const num = Number(raw)
      if (!isNaN(num) && num > 0.01) price = num // ignore zero / bogus
      if (price) break
    }
    const isOrg = isOrganic(p)
    if (price == null) {
      // record presence but price unavailable (out of stock)
      if (isOrg) orgPrices.push(null)
      else regPrices.push(null)
      continue
    }
    if (isOrg) orgPrices.push(price)
    else regPrices.push(price)
  }
  console.log(`⏺ store ${locationId}: regular dozen = ${regPrices.length}, organic dozen = ${orgPrices.length}`)

  if (orgPrices.length === 0) {
    // log sample dozen products that may be organic but not detected
    const sample = data.filter(isTwelveCountProduct).slice(0, 3)
    sample.forEach(s => {
      console.log('🧐 sample dozen product:', s.description, ' size:', s.items?.[0]?.size)
    })
  }

  const calc = (arr, fn) => {
    const nums = arr.filter(v => v != null && v > 0.01)
    return nums.length ? fn(nums) : null
  }
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

  let status
  const regHasPrice = regPrices.some(v=>v!=null)
  const orgHasPrice = orgPrices.some(v=>v!=null)
  if (!foundDozen) status = 'NO_DATA_FOUND'
  else if (!regHasPrice && !orgHasPrice) status = 'OUT_OF_STOCK'
  else status = 'OK'

  if (!regHasPrice && !orgHasPrice) return null // skip row if no priced cartons

  const now = new Date();
  const capturedDate = now.toISOString().split('T')[0]; // Extract YYYY-MM-DD

  return {
    location_id: locationId,
    captured_at: now.toISOString(),
    captured_date: capturedDate, // Add the date-only field
    status,
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
  const storeIds = await fetchStoreIds()
  console.log(`📦 processing ${storeIds.length} stores`)

  let processed = 0
  for (const loc of storeIds) {
    let row = null
    try {
      row = await summarizeEggPrices(loc)
    } catch (err) {
      console.warn('skip store', loc, err.message)
    }
    if (row) {
      // Change from insert to upsert
      const { error } = await sb.from('kroger_egg_prices').upsert(row, {
        onConflict: 'location_id, captured_date', // Specify conflict columns based on unique constraint
        // ignoreDuplicates: false, // Default is false, ensures update on conflict
      });

      if (error) {
        // Handle potential constraint violation errors if needed, though upsert should manage duplicates
        console.error(`❌ Upsert failed for store ${loc}:`, error)
        // Consider if you want to exit(1) or just log and continue
        // process.exit(1);
      } else {
        console.log(`✔︎ saved/updated store ${loc} for date ${row.captured_date} status=${row.status}`)
      }
    } else {
      console.log(`⚪️ skipped store ${loc} (no priced dozens found)`);
    }
    processed++
    if (processed % 100 === 0) console.log(`… processed ${processed}/${storeIds.length}`)
    await sleep(500)
  }
  console.timeEnd('egg-price-import')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
}) 