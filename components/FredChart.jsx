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

export default function FredChart({ symbol = 'APU0000703111', start = '1980-01-01', end = '2025-12-31', showTimestamp = false }) {
  const [data, setData] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/fred?symbol=${symbol}&start=${start}&end=${end}`)
        const json = await res.json()
        if (json.observations) {
          const formatted = json.observations
            .filter(obs => obs.value !== '.') // skip missing values
            .map(obs => ({
              date: obs.date,
              value: parseFloat(obs.value),
            }))
          setData(formatted)
          
          // Find the most recent data point
          if (formatted.length > 0) {
            const mostRecent = formatted[formatted.length - 1]
            setLastUpdated(mostRecent.date)
          }
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
      width: '100%',
      height: '100%',
      maxHeight: '250px',
      pointerEvents: 'auto',
      overflow: 'hidden',
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={1.0}/>
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.4}/>
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" fill="url(#areaGradient)" stroke="none" />
          <Line type="monotone" dataKey="value" stroke="url(#lineGradient)" strokeWidth={2} dot={false} />
          <XAxis dataKey="date" hide />
          <YAxis hide domain={[ 'dataMin', 'dataMax' ]} />
          <Tooltip
            isAnimationActive={false}
            labelFormatter={date => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            formatter={value => [`$${value.toFixed(2)}`, 'Avg Egg Price']}
            contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: 4, color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            cursor={{ stroke: '#666', strokeDasharray: '3 3' }}
          />
        </LineChart>
      </ResponsiveContainer>
      {showTimestamp && lastUpdated && (
        <div style={{ fontSize: '0.6em', color: '#666', marginTop: 4 }}>
          Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      )}
    </div>
  )
} 