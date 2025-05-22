import { NextResponse } from 'next/server'

export const revalidate = 3600  // cache at edge for 1 hour

export async function GET() {
  const TICKERS = ['KR','TGT','COST','ACI','AMZN','WMT']
  const key     = process.env.POLYGON_API_KEY
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
      const updated_at = t.lastTrade?.t ? new Date(t.lastTrade.t).toISOString() : new Date().toISOString()
      return { symbol: t.ticker, price: p, change_pct, updated_at }
    })
  } else {
    // Fallback to previous day close
    const aggPromises = TICKERS.map(sym =>
      fetch(`https://api.polygon.io/v2/aggs/ticker/${sym}/prev?apiKey=${key}`, { next: { revalidate: 3600 } })
    )
    const aggRes = await Promise.all(aggPromises)
    const aggJsons = await Promise.all(aggRes.map(r => r.ok ? r.json().catch(() => null) : null))
    rows = aggJsons.map((j, i) => {
      const day = j?.results?.[0]
      if (!day) return null
      const p = day.c
      const o = day.o ?? p
      const change_pct = p != null && o != null ? ((p - o) / o) * 100 : null
      const updated_at = new Date(day.t).toISOString()
      return { symbol: TICKERS[i], price: p, change_pct, updated_at }
    }).filter(r => r !== null)
  }

  return NextResponse.json({ data: rows })
} 