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

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function isDozen(pkg) {
  // Early USDA rows often have blank/null package_size; accept them.
  if (!pkg) return true
  const p = pkg.toString().toLowerCase()
  return p.includes('12') || p.includes('dozen')
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
  const creds = Buffer.from(`${USDA_API_KEY}:`).toString('base64')

  const agg = new Map() // map<date, { regular: price[], organic: price[] }>

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

  // Fetch the latest date from Supabase ONLY if running in latestOnly mode
  const lastRefDate = latestOnly ? await getLatestRefDate() : null

  function parseUsdaDate(str = '') {
    // format: MM/DD/YYYY HH:MM:SS (sometimes only date)
    const [datePart] = str.split(' ')
    const [m, d, y] = datePart.split('/').map(Number)
    return new Date(y, m - 1, d)
  }

  for (const r of rows) {
    // Skip if older/equal to last stored date when in latestOnly mode
    if (latestOnly && lastRefDate && parseUsdaDate(r.report_date) <= lastRefDate) continue

    if (!r.package_size) continue
    if (!isDozen(r.package_size)) continue
    const price = parseFloat(r.price_avg)
    if (!price || Number.isNaN(price)) continue

    const kind = (r.environment || '').toLowerCase().includes('organic') ? 'organic' : 'regular'
    let entry = agg.get(r.report_date)
    if (!entry) entry = { regular: [], organic: [] }
    entry[kind].push(price)
    agg.set(r.report_date, entry)
  }

  console.log(`Aggregated map size before flush: ${agg.size}`);
  await flush(agg); // Flush potentially empty map if nothing new found
  console.log(`🎉 USDA weekly sync ${latestOnly ? '(latest only)' : '(full)'} complete`);
}

async function flush(map) {
  const now = new Date().toISOString()
  const out = []
  for (const [date, entry] of map.entries()) {
    for (const kind of ['regular', 'organic']) {
      const arr = entry[kind]
      if (!arr.length) continue
      const avg = arr.reduce((s, p) => s + p, 0) / arr.length
      const min = parseFloat(Math.min(...arr).toFixed(2))
      const max = parseFloat(Math.max(...arr).toFixed(2))
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