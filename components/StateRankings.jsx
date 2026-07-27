'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { YELLOW, BLUE, PURPLE, RED } from '../lib/terminalTheme';

// Each column is independently sortable, same convention as the local store
// list - click a header to sort by it, click again to flip direction.
const COLUMNS = {
  state: { defaultDir: 'asc', get: (s) => s.state },
  avgRegular: { defaultDir: 'asc', get: (s) => s.avgRegular },
  avgOrganic: { defaultDir: 'asc', get: (s) => s.avgOrganic },
  volatilityRegular: { defaultDir: 'desc', get: (s) => s.volatilityRegular },
};

// stats/error are fetched once by the parent (BloombergTerminal) and shared
// with StatePriceMap - each fetching this independently tripled concurrent
// load on an already-slow query and pushed it past Supabase's timeout.
export default function StateRankings({ stats, error }) {
  const router = useRouter();
  const states = stats;
  const [sortField, setSortField] = useState('avgRegular');
  const [sortDir, setSortDir] = useState('asc');

  if (error) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Failed to load state price data.</div>;
  }
  if (!states) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Loading state price data…</div>;
  }

  // A couple of near-zero-store states have no price history at any
  // lookback (see database/005_create_state_price_stats.sql) - left out
  // rather than shown as fake zeros.
  const ranked = states.filter((s) => s.avgRegular != null);

  const handleSortClick = (field) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(COLUMNS[field].defaultDir);
    }
  };

  const { get } = COLUMNS[sortField];
  const sorted = [...ranked].sort((a, b) => {
    const av = get(a), bv = get(b);
    const diff = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? diff : -diff;
  });

  const sortArrow = (field) => (sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '');

  const colHeaderStyle = (field, color) => ({
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    color: sortField === field ? color : '#666',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.58rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    padding: 0,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Menlo, monospace' }}>
      <div style={{ textAlign: 'right', padding: '0 4px 2px', fontSize: '0.56rem', color: '#555', fontStyle: 'italic' }}>
        click a state to see all its stores · trailing 12mo avg
      </div>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          background: '#000',
          padding: '1px 4px 4px',
          borderBottom: '1px solid #242424',
        }}
      >
        <div style={{ width: 42, flexShrink: 0 }}>
          <button style={{ ...colHeaderStyle('state', YELLOW), justifyContent: 'flex-start' }} onClick={() => handleSortClick('state')}>
            ST {sortArrow('state')}
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <button style={colHeaderStyle('avgRegular', BLUE)} onClick={() => handleSortClick('avgRegular')}>
            AVG REG {sortArrow('avgRegular')}
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <button style={colHeaderStyle('avgOrganic', PURPLE)} onClick={() => handleSortClick('avgOrganic')}>
            AVG ORG {sortArrow('avgOrganic')}
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <button style={colHeaderStyle('volatilityRegular', RED)} onClick={() => handleSortClick('volatilityRegular')}>
            VOLATILITY {sortArrow('volatilityRegular')}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map((s) => (
          <div
            key={s.state}
            onClick={() => router.push(`/state/${s.state}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '3px 4px',
              borderBottom: '1px solid #141414',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#111'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width: 42, flexShrink: 0, color: YELLOW, fontWeight: 700, fontSize: '0.72rem' }}>{s.state}</div>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '0.72rem' }}>${s.avgRegular.toFixed(2)}</div>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '0.72rem' }}>
              {s.avgOrganic != null ? `$${s.avgOrganic.toFixed(2)}` : '--'}
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.7rem', color: '#aaa' }}>
              {s.volatilityRegular != null ? s.volatilityRegular.toFixed(2) : '--'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
