'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { BLUE, ORANGE, PURPLE, GREEN, RED, YELLOW } from '../lib/terminalTheme';

const PIE_COLORS = [BLUE, ORANGE, PURPLE, GREEN, RED, YELLOW];

export default function NationalStoreStats({ stats, error }) {
  if (error) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Failed to load store stats.</div>;
  }
  if (!stats) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Loading store stats…</div>;
  }

  // Show the top brands individually; bucket the long tail of small Kroger
  // banners (often single-digit store counts) into "Other" - shown as its
  // own real slice with its own count, not silently dropped.
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
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 10 }}>
      <div style={{ width: 84, height: '90%', flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              innerRadius="52%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="#000"
              strokeWidth={2}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value, name) => [value.toLocaleString(), name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend as a real list, not just hover tooltips - "Other" gets its
          own row with its own count and share, same as every named brand.
          The total lives here too now, as a header line above the
          breakdown, instead of its own separate side block. */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'Menlo, monospace' }}>
        <div style={{ fontSize: '0.64rem', color: '#fff', fontWeight: 700, marginBottom: 2 }}>
          {stats.totalStores.toLocaleString()} stores · {stats.brands.length} brands
        </div>
        {chartData.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
            <span style={{ color: '#ccc', fontSize: '0.62rem', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.name}
            </span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.62rem' }}>{d.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
