'use client';

import React, { useEffect, useState } from 'react';

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

  const statStyle = { textAlign: 'center' };
  const statValueStyle = { fontSize: '1.4rem', fontWeight: 'bold' };
  const statLabelStyle = { fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Menlo, monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 0 12px', borderBottom: '1px solid #222' }}>
        <div style={statStyle}>
          <div style={{ ...statValueStyle, color: '#ff5f5f' }}>{last30Days.newDetections}</div>
          <div style={statLabelStyle}>New (30d)</div>
        </div>
        <div style={statStyle}>
          <div style={statValueStyle}>{totals.commercialFlocks.toLocaleString()}</div>
          <div style={statLabelStyle}>Commercial Flocks</div>
        </div>
        <div style={statStyle}>
          <div style={statValueStyle}>{totals.backyardFlocks.toLocaleString()}</div>
          <div style={statLabelStyle}>Backyard Flocks</div>
        </div>
        <div style={statStyle}>
          <div style={{ ...statValueStyle, color: 'var(--accent-color)' }}>{formatBirds(totals.totalBirdsAffected)}</div>
          <div style={statLabelStyle}>Birds Affected (Total)</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead>
            <tr style={{ color: '#888', textAlign: 'left' }}>
              <th style={{ padding: '2px 6px', fontWeight: 'normal' }}>Date</th>
              <th style={{ padding: '2px 6px', fontWeight: 'normal' }}>County, State</th>
              <th style={{ padding: '2px 6px', fontWeight: 'normal' }}>Type</th>
              <th style={{ padding: '2px 6px', fontWeight: 'normal', textAlign: 'right' }}>Birds</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid #1a1a1a' }}>
                <td style={{ padding: '3px 6px', color: '#ccc' }}>{formatDate(r.confirmed_date)}</td>
                <td style={{ padding: '3px 6px', color: '#ccc' }}>{r.county}, {r.state}</td>
                <td style={{ padding: '3px 6px', color: r.flock_type === 'commercial' ? '#ff5f5f' : '#888' }}>
                  {r.flock_type}
                </td>
                <td style={{ padding: '3px 6px', color: '#ccc', textAlign: 'right' }}>{r.birds_affected.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '0.65rem', color: '#666', textAlign: 'center', paddingTop: 6, borderTop: '1px solid #222' }}>
        Source: USDA APHIS
      </div>
    </div>
  );
}
