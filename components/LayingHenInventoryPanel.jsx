import React from 'react';
import { changeColor, changeSign, GRAY } from '../lib/terminalTheme';

function formatHead(n) {
  if (typeof n !== 'number') return '--';
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function formatMonth(dateStr) {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

function formatUpdated(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

// Bare-bones inline sparkline - no axes/labels, just the shape of the last
// 12 months, matching the terminal's other charts' plain-line style.
function Sparkline({ points, width = 90, height = 34 }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flexShrink: 0 }}>
      <polyline points={coords} fill="none" stroke={GRAY} strokeWidth="1.25" />
    </svg>
  );
}

// Renders only once the parent confirms `data.ready` - a missing/delayed
// USDA release or an empty pipeline means this component just isn't mounted
// at all (see BloombergTerminal.jsx), not a broken-looking module on the page.
export default function LayingHenInventoryPanel({ data }) {
  if (!data || !data.ready) return null;

  const { current, momPct, yoyPct, source, lastUpdated, history } = data;
  const sparkPoints = (history || []).slice(-12).map(h => h.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', fontFamily: 'Menlo, monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
          {formatHead(current.value)}
        </div>
        <Sparkline points={sparkPoints} />
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ccc' }}>
          <span style={{ color: changeColor(momPct) }}>{momPct != null ? changeSign(momPct) : ''}</span>
          {' '}{momPct != null ? `${Math.abs(momPct).toFixed(1)}% MoM` : '-- MoM'}
        </span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ccc' }}>
          <span style={{ color: changeColor(yoyPct) }}>{yoyPct != null ? changeSign(yoyPct) : ''}</span>
          {' '}{yoyPct != null ? `${Math.abs(yoyPct).toFixed(1)}% YoY` : '-- YoY'}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.6rem', color: '#666' }}>
        {formatMonth(current.referenceDate)} · {source}{lastUpdated ? ` · UPDATED ${formatUpdated(lastUpdated)}` : ''}
      </div>
    </div>
  );
}
