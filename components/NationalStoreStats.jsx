'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const BAR_COLORS = ['#00b7ff', '#fd7e14', '#00c800', '#e0e0e0', '#ff5f5f', '#c084fc'];

export default function NationalStoreStats({ stats, error }) {
  if (error) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Failed to load store stats.</div>;
  }
  if (!stats) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Loading store stats…</div>;
  }

  // Show the top brands individually; bucket the long tail of small Kroger
  // banners (often single-digit store counts) so their bars aren't reduced
  // to invisible slivers next to Target/Kroger.
  const TOP_N = 5;
  const sorted = [...stats.brands].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const restTotal = rest.reduce((sum, b) => sum + b.count, 0);
  const chartData = [
    ...top.map(b => ({ name: b.brand, count: b.count })),
    ...(restTotal > 0 ? [{ name: `Other (${rest.length} brands)`, count: restTotal }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00c800' }}>
          {stats.totalStores.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Stores Surveyed Nationwide
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
            <XAxis type="number" stroke="#666" tick={{ fontSize: 10 }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#ccc"
              tick={{ fontSize: 10, fill: '#ccc' }}
              width={110}
              interval={0}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="count" radius={[0, 2, 2, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
