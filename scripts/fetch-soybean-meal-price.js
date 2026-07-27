import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import { runIfMain } from './lib/run-if-main.js'

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, FRED_API_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
  process.exit(1)
}
if (!FRED_API_KEY) {
  console.error('❌ FRED_API_KEY env var missing')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// BLS Producer Price Index: Processed Foods and Feeds - Soybean Cake, Meal,
// and Byproducts. NASS's own soybean meal "price paid" series was
// discontinued in 2014 and no live national USDA/AMS soybean meal series
// exists, so this is the best current official U.S. government series (see
// database/024). It's an index (not a $ price) - tracked for its own
// relative change, same as usda_layer_inventory.
const SERIES_ID = 'WPU029201'

async function main() {
  console.log('📡 Fetching FRED soybean meal PPI (series WPU029201)...')

  const url = new URL('https://api.stlouisfed.org/fred/series/observations')
  url.searchParams.set('series_id', SERIES_ID)
  url.searchParams.set('api_key', FRED_API_KEY)
  url.searchParams.set('file_type', 'json')
  url.searchParams.set('sort_order', 'asc')

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`❌ FRED API request failed (${res.status}): ${text.slice(0, 300)}`)
    process.exit(1)
  }

  const json = await res.json()
  if (json.error_code) {
    console.error(`❌ FRED API error: ${json.error_message || json.error_code}`)
    process.exit(1)
  }

  const observations = json.observations || []
  if (!observations.length) {
    console.error('❌ FRED API returned zero observations. Not touching existing data.')
    process.exit(1)
  }

  const upserts = []
  let skipped = 0
  for (const obs of observations) {
    const value = Number(obs.value)
    // FRED uses "." for missing values.
    if (!obs.date || obs.value === '.' || !Number.isFinite(value)) {
      skipped++
      continue
    }
    upserts.push({
      commodity: 'soybean_meal',
      reference_date: obs.date,
      value,
      unit: 'index (1982=100)',
      source: 'FRED (BLS PPI)',
      source_series_id: SERIES_ID,
      source_load_time: null,
      fetched_at: new Date().toISOString(),
    })
  }

  if (skipped) console.warn(`⚠️ Skipped ${skipped} observation(s) with missing values`)
  if (!upserts.length) {
    console.error('❌ No valid rows to upsert after parsing. Not touching existing data.')
    process.exit(1)
  }

  const { error } = await sb
    .from('feed_commodity_prices')
    .upsert(upserts, { onConflict: 'commodity,reference_date' })

  if (error) {
    console.error('❌ Upsert failed:', error.message)
    process.exit(1)
  }

  const latest = upserts.reduce((a, b) => (a.reference_date > b.reference_date ? a : b))
  console.log(`✅ Upserted ${upserts.length} monthly observations. Latest: ${latest.reference_date} = ${latest.value} (index)`)
}

runIfMain(main, import.meta.url)
