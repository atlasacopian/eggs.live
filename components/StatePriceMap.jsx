'use client';

import React, { useState } from 'react';
import { STATE_PATHS, STATE_LABEL_POINTS, STATE_MAP_VIEWBOX } from '../lib/stateMapPaths';
import { BLUE, PURPLE } from '../lib/terminalTheme';

// Same hue for the whole map, scaled from dim (cheap) to full brightness
// (expensive) - a diverging multi-hue scale would fight the app's existing
// Regular=blue / Organic=purple color identity used everywhere else.
function priceColor(price, min, max, hex) {
  if (price == null || max === min) return hex;
  const t = Math.max(0, Math.min(1, (price - min) / (max - min)));
  const opacity = 0.3 + t * 0.7;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * opacity)}, ${Math.round(g * opacity)}, ${Math.round(b * opacity)})`;
}

// stats/error are fetched once by the parent (BloombergTerminal) and shared
// with StateRankings - each fetching this independently tripled concurrent
// load on an already-slow query and pushed it past Supabase's timeout.
export default function StatePriceMap({ stats, error }) {
  const states = stats;
  const [priceType, setPriceType] = useState('regular');

  if (error) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Failed to load state price data.</div>;
  }
  if (!states) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Loading state price data…</div>;
  }

  const byState = {};
  for (const s of states) byState[s.state] = s;

  const field = priceType === 'regular' ? 'avgRegular' : 'avgOrganic';
  const hex = priceType === 'regular' ? BLUE : PURPLE;
  const values = states.map((s) => s[field]).filter((v) => typeof v === 'number');
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  const controlBtnStyle = (active) => ({
    background: 'transparent',
    border: 'none',
    color: active ? hex : '#666',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.65rem',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    padding: '2px 6px',
    textTransform: 'uppercase',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Menlo, monospace' }}>
      <div>
        <button style={controlBtnStyle(priceType === 'regular')} onClick={() => setPriceType('regular')}>
          {priceType === 'regular' ? '[ Regular ]' : 'Regular'}
        </button>
        <button style={controlBtnStyle(priceType === 'organic')} onClick={() => setPriceType('organic')}>
          {priceType === 'organic' ? '[ Organic ]' : 'Organic'}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={STATE_MAP_VIEWBOX} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          {Object.entries(STATE_PATHS).map(([code, d]) => {
            const s = byState[code];
            const price = s ? s[field] : null;
            const fill = price != null ? priceColor(price, min, max, hex) : '#141414';
            return <path key={code} d={d} fill={fill} stroke="#000" strokeWidth={1} />;
          })}
          {Object.entries(STATE_LABEL_POINTS).map(([code, [x, y]]) => {
            const s = byState[code];
            const price = s ? s[field] : null;
            if (price == null) return null;
            return (
              <text
                key={code}
                x={x}
                y={y}
                fontSize="8"
                fontWeight="700"
                fill="#fff"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none' }}
              >
                {price.toFixed(2)}
              </text>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.58rem', color: '#888', marginTop: 2 }}>
        <span>${min.toFixed(2)}</span>
        <div style={{ flex: 1, height: 5, background: `linear-gradient(90deg, ${priceColor(min, min, max, hex)}, ${priceColor(max, min, max, hex)})` }} />
        <span>${max.toFixed(2)}</span>
      </div>
    </div>
  );
}
