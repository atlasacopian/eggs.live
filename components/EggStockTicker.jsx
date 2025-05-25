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
    const price = typeof t.price === 'number' ? t.price : 0
    const pct = typeof t.change_pct === 'number' ? t.change_pct.toFixed(2) : '–'
    const color = t.change_pct != null && t.change_pct >= 0 ? '#0a0' : '#a00'
    return `<span style="margin:0 1rem; color:${color};">${t.symbol} ${price.toFixed(2)} ${pct}%</span>`
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