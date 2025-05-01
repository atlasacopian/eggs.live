import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, FRED_API_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase env vars missing')
  process.exit(1)
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  const series = 'APU0000703111'
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('FRED request failed', res.status)
    process.exit(1)
  }
  const json = await res.json()
  const obs = (json.observations || [])[0]
  if (!obs || obs.value === '.') {
    console.log('No new FRED value yet')
    process.exit(0)
  }
  const row = {
    ref_date: obs.date,
    source: 'FRED',
    metric: 'retail_price',
    product_type: 'regular',
    unit: 'USD/dozen',
    price: parseFloat(obs.value),
    price_min: null,
    price_max: null,
    obs_count: null,
    captured_at: new Date().toISOString(),
    raw_json: null,
  }
  const { error } = await sb.from('national_egg_prices').upsert(row, {
    onConflict: 'source,metric,product_type,ref_date,price,price_min,price_max,obs_count',
  })
  if (error) throw error
  console.log(`✅ FRED row for ${row.ref_date} stored (price $${row.price})`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
}) 