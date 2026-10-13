import { config } from 'dotenv'
config({ path: '.env.local' })
import { fetchWithRetry } from './lib/fetch-with-retry.js'
import { createClient } from '@supabase/supabase-js'
import { runIfMain } from './lib/run-if-main.js'

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, USDA_NASS_API_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
  process.exit(1)
}
if (!USDA_NASS_API_KEY) {
  console.error('❌ USDA_NASS_API_KEY env var missing – get one at https://quickstats.nass.usda.gov/api')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const MONTHS = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
}

// "FIRST OF JUL" + year -> '2026-07-01'. Anything else (blank, mid-month
// reference periods this data item has never used) is treated as unparseable
// and skipped rather than guessed at.
function toReferenceDate(referencePeriodDesc, year) {
  const m = /^FIRST OF (\w{3})$/.exec((referencePeriodDesc || '').trim())
  if (!m) return null
  const mon = MONTHS[m[1]]
  if (!mon) return null
  return `${year}-${mon}-01`
}

async function main() {
  console.log('📡 Fetching USDA NASS table-egg layer inventory (Quick Stats API)...')

  const url = new URL('https://quickstats.nass.usda.gov/api/api_GET/')
  url.searchParams.set('key', USDA_NASS_API_KEY)
  url.searchParams.set('commodity_desc', 'CHICKENS')
  // "LAYERS, TABLE" specifically excludes hatching-egg-type layers (broiler-
  // type and egg-type breeders), which the API reports as separate classes.
  url.searchParams.set('class_desc', 'LAYERS, TABLE')
  url.searchParams.set('statisticcat_desc', 'INVENTORY')
  url.searchParams.set('agg_level_desc', 'NATIONAL')
  url.searchParams.set('format', 'JSON')

  const res = await fetchWithRetry(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`❌ Quick Stats API request failed (${res.status}): ${text.slice(0, 300)}`)
    process.exit(1)
  }

  const json = await res.json()
  const rows = json.data || []
  if (!rows.length) {
    console.error('❌ Quick Stats API returned zero rows - USDA may have changed the data item, or the report is mid-revision. Not touching existing data.')
    process.exit(1)
  }

  const upserts = []
  let skipped = 0
  for (const row of rows) {
    const referenceDate = toReferenceDate(row.reference_period_desc, row.year)
    const value = Number(String(row.Value ?? '').replace(/,/g, ''))
    if (!referenceDate || !Number.isFinite(value) || value <= 0) {
      skipped++
      continue
    }
    upserts.push({
      reference_date: referenceDate,
      inventory_head: value,
      reference_period_desc: row.reference_period_desc,
      usda_load_time: row.load_time || null,
      fetched_at: new Date().toISOString(),
    })
  }

  if (skipped) console.warn(`⚠️ Skipped ${skipped} row(s) with unparseable/missing values`)
  if (!upserts.length) {
    console.error('❌ No valid rows to upsert after parsing. Not touching existing data.')
    process.exit(1)
  }

  const { error } = await sb
    .from('usda_layer_inventory')
    .upsert(upserts, { onConflict: 'reference_date' })

  if (error) {
    console.error('❌ Upsert failed:', error.message)
    process.exit(1)
  }

  const latest = upserts.reduce((a, b) => (a.reference_date > b.reference_date ? a : b))
  console.log(`✅ Upserted ${upserts.length} monthly observations. Latest: ${latest.reference_date} = ${latest.inventory_head.toLocaleString()} head`)
}

runIfMain(main, import.meta.url)
