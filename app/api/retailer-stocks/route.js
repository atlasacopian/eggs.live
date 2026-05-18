import { NextResponse } from 'next/server'

export const revalidate = 3600  // cache at edge for 1 hour

export async function GET() {
  const TICKERS = ['KR','TGT','COST','ACI','AMZN','WMT']
  const key =
    process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'Missing MASSIVE_API_KEY (or POLYGON_API_KEY)' },
      { status: 500 }
    )
  }
  const snapshotUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${TICKERS.join(',')}&apiKey=${key}`

  // Fetch live snapshot (may return empty when market closed)
  const snapshotRes = await fetch(snapshotUrl, { next: { revalidate: 3600 } })
  if (!snapshotRes.ok) {
    const err = await snapshotRes.text().catch(() => 'Unknown error')
    return NextResponse.json({ error: err }, { status: snapshotRes.status })
  }
  const snapJson = await snapshotRes.json()
  let rows = []
  if (Array.isArray(snapJson.tickers) && snapJson.tickers.length > 0) {
    // Map snapshot to row shape
    rows = snapJson.tickers.map(t => {
      const p = t.lastTrade?.p ?? t.day?.c ?? null
      const o = t.day?.o ?? p
      const change_pct = p != null && o != null ? ((p - o) / o) * 100 : null
      
      // Use a more appropriate timestamp for market data display
      let updated_at
      if (t.lastTrade?.t) {
        const tradeTime = new Date(t.lastTrade.t)
        const tradeHour = tradeTime.getUTCHours() - 5 // Convert to ET (approximate)
        
        // If trade was during market hours (9:30 AM - 4:00 PM ET), use it
        // Otherwise, use market close time (4:00 PM ET) for the trading day
        if (tradeHour >= 9.5 && tradeHour <= 16) {
          updated_at = tradeTime.toISOString()
        } else {
          // Use 4:00 PM ET of the most recent trading day
          const marketClose = new Date(tradeTime)
          marketClose.setUTCHours(21, 0, 0, 0) // 4:00 PM ET = 21:00 UTC
          updated_at = marketClose.toISOString()
        }
      } else {
        updated_at = new Date().toISOString()
      }
      
      return { symbol: t.ticker, price: p, change_pct, updated_at }
    })
  } else {
    // Fallback to yesterday's close via free open-close endpoint
    // Compute yesterday's date in America/New_York
    const nowNY = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const y = new Date(nowNY)
    do {
      y.setDate(y.getDate() - 1)
    } while (y.getDay() === 0 || y.getDay() === 6)
    const yyyy = y.getFullYear()
    const mm = String(y.getMonth() + 1).padStart(2, '0')
    const dd = String(y.getDate()).padStart(2, '0')
    const date = `${yyyy}-${mm}-${dd}`

    const openClosePromises = TICKERS.map(sym =>
      fetch(`https://api.polygon.io/v1/open-close/${sym}/${date}?adjusted=true&apiKey=${key}`)
    )
    const openCloseRes = await Promise.all(openClosePromises)
    const openCloseJsons = await Promise.all(
      openCloseRes.map(r => (r.ok ? r.json().catch(() => null) : null))
    )
    rows = openCloseJsons.map((j, i) => {
      if (!j || typeof j.close !== 'number' || typeof j.open !== 'number') return null
      const p = j.close
      const o = j.open
      const change_pct = o !== 0 ? ((p - o) / o) * 100 : null
      // Use date at market close as updated_at
      const updated_at = new Date(Date.UTC(y.getFullYear(), y.getMonth(), y.getDate(), 21, 0, 0)).toISOString()
      return { symbol: TICKERS[i], price: p, change_pct, updated_at }
    }).filter(r => r !== null)
  }

  return NextResponse.json({ data: rows })
} 