// scripts/fetch-retailer-stocks.js
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, POLYGON_API_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !POLYGON_API_KEY) {
  console.error('❌ Missing env vars. Need SUPABASE_URL, SUPABASE_SERVICE_KEY, POLYGON_API_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function marketOpen () {
  const nowNY = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const d = nowNY.getDay()
  if (d === 0 || d === 6) return false
  const m = nowNY.getHours() * 60 + nowNY.getMinutes()
  const open = 9 * 60 + 30
  const close = 16 * 60 + 10
  return m >= open && m <= close
}
if (!marketOpen() && !process.env.FORCE_POLYGON_FETCH) {
  console.log('Market closed – skipping Polygon fetch.')
  process.exit(0)
}

const TICKERS = ['KR', 'TGT', 'COST', 'ACI', 'AMZN', 'WMT']

async function fetchSnapshot () {
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${TICKERS.join(',')}&apiKey=${POLYGON_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Polygon ${res.status}`)
  const json = await res.json()
  if (json.status !== 'OK') throw new Error(`Polygon status ${json.status}`)
  return json.tickers ?? []
}

;(async () => {
  try {
    const tickers = await fetchSnapshot()
    const now = new Date().toISOString()
    const rows = tickers.map(t => {
      const price = t.lastTrade?.p ?? t.day?.c ?? null
      const open = t.day?.o ?? price
      const change_pct = price && open ? ((price - open) / open) * 100 : null
      return { symbol: t.ticker, price, change_pct, updated_at: now }
    })
    if (rows.length === 0) {
      console.log('No tickers returned')
      process.exit(0)
    }
    const { error } = await sb.from('retailer_stock_quotes').upsert(rows, { onConflict: 'symbol' })
    if (error) {
      console.error('Supabase upsert error', error)
      process.exit(1)
    }
    console.log(`✅ Upserted ${rows.length} retailer quotes at ${now}`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error', err)
    process.exit(1)
  }
})() 