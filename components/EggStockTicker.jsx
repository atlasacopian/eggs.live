'use client'

import React, { useState, useEffect } from 'react'
import TickerStrip from './TickerStrip'

export default function EggStockTicker() {
  const [tickers, setTickers] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/egg-stocks')
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        setTickers(Array.isArray(json.data) ? json.data : [])
      } catch (err) {
        setError(err)
      }
    }
    fetchData()
  }, [])

  if (error) return <div style={{ padding: '4px', color: 'red' }}>Error loading egg stocks</div>
  if (tickers === null) return <div style={{ padding: '4px' }}>Loading…</div>

  const text = tickers.map(t => {
    const priceStr =
      typeof t.price === 'number' && Number.isFinite(t.price)
        ? t.price.toFixed(2)
        : '—'
    const pct =
      typeof t.change_pct === 'number' && Number.isFinite(t.change_pct)
        ? t.change_pct.toFixed(2)
        : '–'
    const color =
      t.change_pct != null && Number.isFinite(t.change_pct) && t.change_pct >= 0
        ? '#00FF00'
        : '#FF0000'
    return `<span style="margin:0 1rem; color:${color};">${t.symbol} ${priceStr} ${pct}%</span>`
  }).join('')

  return (
    <TickerStrip
      text={text}
      overrideBackgroundColor="#fff"
      overrideBorderColor="#000"
      fontSize="14px"
    />
  )
} 