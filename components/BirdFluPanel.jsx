'use client';

import React, { useEffect, useState } from 'react';
import { RED, YELLOW } from '../lib/terminalTheme';

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y.slice(2)}`;
}

function formatBirds(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function BirdFluPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/hpai-detections')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Failed to load HPAI data.</div>;
  }
  if (!data) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Loading HPAI data…</div>;
  }

  const { totals, last30Days, recent } = data;

  // A real terminal doesn't render stats as centered stat cards - it's a
  // line-item list, label left, value right, like a field readout.
  const statRows = [
    ['New (30d)', last30Days.newDetections, YELLOW],
    ['Birds Affected', formatBirds(totals.totalBirdsAffected), RED],
    ['Commercial', totals.commercialFlocks.toLocaleString(), '#fff'],
    ['Backyard', totals.backyardFlocks.toLocaleString(), '#fff'],
  ];

  return (
    <div style={{ display: 'flex', height: '100%', gap: 6, fontFamily: 'Menlo, monospace' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0, width: 88, borderRight: '1px solid #222', paddingRight: 6 }}>
        {statRows.map(([label, value, color], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '3px 2px',
              borderBottom: i < statRows.length - 1 ? '1px solid #1a1a1a' : 'none',
            }}
          >
            <span style={{ fontSize: '0.54rem', color: '#888', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Compact one-line-per-detection list instead of a wide table with
          its own header row - denser, and no header row eating height. Flock
          type shown as a colored dot (not the word) to leave room for
          county/state at narrow widths - the color still carries the
          commercial-vs-backyard distinction. */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {recent.slice(0, 8).map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', padding: '2px 0', borderBottom: '1px solid #141414' }}>
            <span style={{ color: '#666', width: 42, flexShrink: 0, whiteSpace: 'nowrap' }}>{formatDate(r.confirmed_date)}</span>
            <span
              title={r.flock_type}
              style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: r.flock_type === 'commercial' ? RED : '#888',
              }}
            />
            <span style={{ color: '#ccc', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.county}, {r.state}
            </span>
            <span style={{ color: '#fff', fontWeight: 600, flexShrink: 0, width: 46, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatBirds(r.birds_affected)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
