import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

export default function FredChart({ symbol = 'APU0000708111', start = '1980-01-01', end = '2025-12-31' }) {
  const [data, setData] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/fred?symbol=${symbol}&start=${start}&end=${end}`)
        const json = await res.json()
        if (json.observations) {
          const formatted = json.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value),
          }))
          setData(formatted)
        }
      } catch (e) {
        console.error('Error fetching FRED data', e)
      }
    }
    fetchData()
  }, [symbol, start, end])

  if (!data.length) return null

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(0,255,255)" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="rgb(0,255,255)" stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(0,255,255)" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="rgb(0,255,255)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" fill="url(#areaGradient)" stroke="none" />
          <Line type="monotone" dataKey="value" stroke="url(#lineGradient)" strokeWidth={3} dot={false} />
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[ 'dataMin', 'dataMax' ]} />
          <Tooltip
            labelFormatter={date => new Date(date).toLocaleDateString()}
            formatter={value => [`$${value.toFixed(2)}`, 'Avg Price']}
            contentStyle={{ background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 4 }}
            itemStyle={{ color: '#0ff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 