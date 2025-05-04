'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function ZipFREDChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/historical-egg-prices')
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(json => setData(json.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#fff', padding: 32 }}>Loading historical prices…</div>;
  if (error) return <div style={{ color: '#f00', padding: 32 }}>Error: {error}</div>;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const domain = [min - 0.5, max + 0.5];
  const ticks = data.filter(d => {
    const date = new Date(d.date);
    return date.getMonth() === 0 && date.getFullYear() % 5 === 0;
  }).map(d => d.date);

  return (
    <div style={{ background: '#000', padding: 24, borderRadius: 8 }}>
      <h2 style={{ fontSize: '1rem', marginBottom: 16, color: '#fff' }}>
        HISTORICAL US AVERAGE EGG PRICES (REG) via FRED
      </h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid stroke="#444" strokeOpacity={0.1} />
            <XAxis
              dataKey="date"
              type="category"
              scale="point"
              ticks={ticks}
              tickFormatter={d => new Date(d).getFullYear()}
              axisLine={false}
              tickLine={false}
              stroke="#666"
              tick={{ fontSize: 10, fill: '#666' }}
            />
            <YAxis
              domain={domain}
              axisLine={false}
              tickLine={false}
              stroke="#666"
              tick={{ fontSize: 10, fill: '#666' }}
              tickFormatter={v => `$${v.toFixed(2)}`}
            />
            <Tooltip contentStyle={{ background: '#000', border: 'none', fontSize: 10 }}
                     labelStyle={{ display: 'none' }} />
            <Line type="linear" dataKey="value" stroke="#ffc107" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 