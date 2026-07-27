import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { citationStyle } from '../lib/terminalTheme'

const WHITE = '#fff'

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
          
          // Use the API response timestamp instead of the data date
          if (json.realtime_end) {
            setLastUpdated(json.realtime_end)
          } else if (formatted.length > 0) {
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
      height: showTimestamp ? 'calc(100% - 25px)' : '100%',
      maxHeight: showTimestamp ? '225px' : '250px',
      pointerEvents: 'auto',
      overflow: 'visible',
    }}>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={WHITE} stopOpacity={0.25}/>
              <stop offset="100%" stopColor={WHITE} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#333" strokeOpacity={0.4} />
          <Area type="linear" dataKey="value" fill="url(#areaGradient)" stroke="none" />
          <Line type="linear" dataKey="value" stroke={WHITE} strokeWidth={1.25} dot={false} />
          <XAxis
            dataKey="date"
            tickFormatter={t => new Date(t).getFullYear()}
            stroke="#444"
            tick={{ fontSize: 10, fill: '#888' }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={['dataMin', 'dataMax']}
            scale="log"
            stroke="#444"
            tick={{ fontSize: 10, fill: '#888' }}
            tickLine={false}
            tickFormatter={v => `$${v.toFixed(2)}`}
            width={42}
            allowDataOverflow
          />
          <Tooltip
            isAnimationActive={false}
            labelFormatter={date => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            formatter={value => [`$${value.toFixed(2)}`, 'Avg Egg Price']}
            contentStyle={{ background: '#000', border: `1px solid ${WHITE}`, borderRadius: 0, color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            cursor={{ stroke: '#666', strokeDasharray: '3 3' }}
          />
        </LineChart>
      </ResponsiveContainer>
      {showTimestamp && lastUpdated && (
        <div style={{ ...citationStyle, marginTop: 4 }}>
          Source: FRED · Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', {
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      )}
    </div>
  )
} 