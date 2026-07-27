import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
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

// Corn price received uses plain 3-letter month reference periods (no
// "FIRST OF" prefix like the point-in-time layer inventory series) since
// it's a monthly average price, not a first-of-month snapshot.
function toReferenceDate(referencePeriodDesc, year) {
  const mon = MONTHS[(referencePeriodDesc || '').trim()]
  if (!mon) return null
  return `${year}-${mon}-01`
}

async function main() {
  console.log('📡 Fetching USDA NASS corn price received (Quick Stats API)...')

  const url = new URL('https://quickstats.nass.usda.gov/api/api_GET/')
  url.searchParams.set('key', USDA_NASS_API_KEY)
  url.searchParams.set('commodity_desc', 'CORN')
  url.searchParams.set('statisticcat_desc', 'PRICE RECEIVED')
  url.searchParams.set('short_desc', 'CORN, GRAIN - PRICE RECEIVED, MEASURED IN $ / BU')
  url.searchParams.set('agg_level_desc', 'NATIONAL')
  url.searchParams.set('freq_desc', 'MONTHLY')
  url.searchParams.set('format', 'JSON')

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`❌ Quick Stats API request failed (${res.status}): ${text.slice(0, 300)}`)
    process.exit(1)
  }

  const json = await res.json()
  const rows = json.data || []
  if (!rows.length) {
    console.error('❌ Quick Stats API returned zero rows. Not touching existing data.')
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
      commodity: 'corn',
      reference_date: referenceDate,
      value,
      unit: '$/bu',
      source: 'USDA NASS',
      source_series_id: row.short_desc,
      source_load_time: row.load_time || null,
      fetched_at: new Date().toISOString(),
    })
  }

  if (skipped) console.warn(`⚠️ Skipped ${skipped} row(s) with unparseable/missing values`)
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
  console.log(`✅ Upserted ${upserts.length} monthly observations. Latest: ${latest.reference_date} = $${latest.value}/bu`)
}

runIfMain(main, import.meta.url)
