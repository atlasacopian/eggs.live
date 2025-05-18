import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  USDA_API_KEY,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase env vars missing')
  process.exit(1)
}

if (!USDA_API_KEY) {
  console.error('❌ USDA_API_KEY env var missing – please set it in your shell, .env.local, or GitHub Action secrets')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function isDozen(pkg) {
  // Early USDA rows often have blank/null package_size; accept them.
  if (!pkg) return true
  const p = pkg.toString().toLowerCase()
  return p.includes('12') || p.includes('dozen')
}

// Exclude rows we don't want (liquid eggs, 18-count)
function shouldSkip(row) {
  const pkg = (row.package_size || '').toLowerCase()
  const typ = (row.type || '').toLowerCase()

  // 1. Skip anything that references liquid eggs
  if (pkg.includes('liquid') || typ.includes('liquid')) return true

  // 2. Skip 18-count packages (e.g. "18 pack")
  if (pkg.match(/\b18\b/) || typ.match(/\b18\b/)) return true

  return false
}

// Add helper to fetch latest ref_date from Supabase
async function getLatestRefDate () {
  const { data, error } = await sb
    .from('usda_weekly_egg_prices')
    .select('ref_date')
    .order('ref_date', { ascending: false })
    .limit(1)
  if (error) {
    console.error('Failed to fetch latest ref_date', error)
    return null
  }
  if (!data || !data.length) return null
  return new Date(data[0].ref_date)
}

// ---------- core fetch + aggregate ----------
export async function run({ latestOnly = false } = {}) {
  const slugId = 'AMS_2757'
  const section = 'Report%20Details'
  const creds = Buffer.from(`${USDA_API_KEY.trim()}:`).toString('base64')

  // NOTE: the MARS API ignores page & pageSize for this endpoint and always
  //       returns the full dataset (~67k rows). We therefore fetch ONCE and
  //       drop the old pagination loop.
  const url = `https://marsapi.ams.usda.gov/services/v1.2/reports/${slugId}/${section}?page=1`
  console.log('📥 USDA fetch …')
    const res = await fetch(url, { headers: { Authorization: `Basic ${creds}` } })
    if (!res.ok) {
      console.error('USDA request failed', res.status)
    return
    }
    const json = await res.json()
    const rows = json.results || []
  console.log(`   ↳ received ${rows.length.toLocaleString()} rows`)

  // 1️⃣ Find the latest week string (MM/DD/YYYY) in this payload
  let latestStr = ''
  let latestCode = 0 // yyyymmdd as number for easy compare
  for (const r of rows) {
    const [m, d, y] = r.report_date.split(' ')[0].split('/')
    const code = parseInt(`${y}${m.padStart(2,'0')}${d.padStart(2,'0')}`, 10)
    if (code > latestCode) {
      latestCode = code
      latestStr = `${m}/${d}/${y}`
    }
  }

  if (!latestStr) {
    console.error('No rows found – abort')
    return
  }

  // 2️⃣ Prepare collectors for that week only
  const nat = { regular: [], organic: [] }   // National rows for average
  const all = { regular: [], organic: [] }   // All regions for min/max

  // Fetch the latest date from Supabase ONLY if running in latestOnly mode
  const lastRefDate = latestOnly ? await getLatestRefDate() : null

  function parseUsdaDate(str = '') {
    // format: MM/DD/YYYY HH:MM:SS (sometimes only date)
    const [datePart] = str.split(' ')
    const [m, d, y] = datePart.split('/').map(Number)
    return new Date(y, m - 1, d)
  }

  // If in latestOnly mode, check if the API data is actually newer than Supabase
  if (latestOnly && lastRefDate) {
    const currentApiLatestDate = parseUsdaDate(latestStr) // latestStr is MM/DD/YYYY
    // Set hours to 0 to compare dates only, avoiding timezone issues if lastRefDate is midnight UTC
    currentApiLatestDate.setHours(0, 0, 0, 0)
    lastRefDate.setHours(0, 0, 0, 0)

    if (currentApiLatestDate <= lastRefDate) {
      console.log(`✅ USDA data already up to date. Supabase latest: ${lastRefDate.toISOString().split('T')[0]}, API payload latest: ${currentApiLatestDate.toISOString().split('T')[0]}. No update needed.`)
      return
    }
    console.log(`ℹ️ New USDA data found. Supabase latest: ${lastRefDate.toISOString().split('T')[0]}, API payload latest: ${currentApiLatestDate.toISOString().split('T')[0]}. Proceeding with update.`)
  }

    for (const r of rows) {
    if (shouldSkip(r)) continue
    if (!r.report_date.startsWith(latestStr)) continue // skip non-CW rows

    if (!isDozen(r.package_size)) continue
      const price = parseFloat(r.price_avg)
      if (!price || Number.isNaN(price)) continue

      const kind = (r.environment || '').toLowerCase().includes('organic') ? 'organic' : 'regular'

      // Push into global collector
      all[kind].push(price)

      // Only push into national collector if region === National
      if ((r.region || '').toLowerCase() === 'national') {
        nat[kind].push(price)
      }
    }

  // Build a pseudo-map with a single entry for flush()
  const outMap = new Map()
  if (latestStr) {
    // convert latestStr (MM/DD/YYYY) to ISO yyyy-mm-dd for ref_date
    const [mS,dS,yS] = latestStr.split('/')
    const iso = `${yS}-${mS.padStart(2,'0')}-${dS.padStart(2,'0')}`
    outMap.set(iso, {
      regular: nat.regular.length ? nat.regular : [],
      organic: nat.organic.length ? nat.organic : [],
      _allRegular: all.regular,
      _allOrganic: all.organic,
    })
  }

  console.log(`Aggregated map size before flush: ${outMap.size}`)
  await flush(outMap)

  console.log(`🎉 USDA weekly sync ${latestOnly ? '(latest only)' : '(full)'} complete`);
}

async function flush(map) {
  const now = new Date().toISOString()
  const out = []
  for (const [date, entry] of map.entries()) {
    for (const kind of ['regular', 'organic']) {
      const arrNat = entry[kind]
      const arrAll = kind === 'regular' ? entry._allRegular : entry._allOrganic
      const arr = arrNat
      if (!arr.length) continue
      const avg = arr.reduce((s, p) => s + p, 0) / arr.length
      const min = parseFloat(Math.min(...arrAll).toFixed(2))
      const max = parseFloat(Math.max(...arrAll).toFixed(2))
      out.push({
        ref_date: date,
        product_type: kind,
        price: parseFloat(avg.toFixed(2)),
        price_min: min,
        price_max: max,
        obs_count: arr.length,
        captured_at: now,
      })
    }
  }
  if (!out.length) return
  for (let i = 0; i < out.length; i += 1000) {
    const chunk = out.slice(i, i + 1000)
    const { error } = await sb.from('usda_weekly_egg_prices').upsert(chunk, {
      onConflict: 'ref_date,product_type',
    })
    if (error) {
      console.error(error)
      process.exit(1)
    }
  }
  console.log(`   ↳ flushed ${out.length} rows (map size ${map.size})`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const latestMode = process.argv.includes('--latest')
  // Run with the determined mode
  run({ latestOnly: latestMode }).catch((err) => {
    console.error(err)
    process.exit(1)
  })
} 