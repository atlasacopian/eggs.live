import React from 'react';
import { changeColor, changeSign, GRAY, PANEL_BORDER } from '../lib/terminalTheme';

function formatMonth(dateStr) {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

// Bare-bones inline sparkline - no axes/labels, matching
// LayingHenInventoryPanel's version (kept local rather than shared since
// it's a single ~15-line function used by two call sites).
function Sparkline({ points, width = 64, height = 26 }) {
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

function CommodityRow({ label, sublabel, valueText, momPct, referenceDate, history, isLast }) {
  const sparkPoints = (history || []).slice(-12).map(h => h.value);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 3,
        padding: '6px 2px',
        borderBottom: isLast ? 'none' : `1px solid ${PANEL_BORDER}`,
      }}
    >
      <div style={{ minWidth: 0, flexShrink: 0 }}>
        <div style={{ fontSize: '0.66rem', color: '#ccc', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: '0.5rem', color: '#666', marginTop: 1, whiteSpace: 'nowrap' }}>{sublabel}</div>
        )}
      </div>

      <Sparkline points={sparkPoints} width={24} height={20} />

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{valueText}</div>
        <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#ccc', marginTop: 1 }}>
          <span style={{ color: changeColor(momPct) }}>{momPct != null ? changeSign(momPct) : ''}</span>
          {' '}{momPct != null ? `${Math.abs(momPct).toFixed(1)}% MoM` : '-- MoM'}
        </div>
      </div>
    </div>
  );
}

// Renders only once both commodities are ready - a missing/delayed release
// from either NASS or FRED just means no module, never a partial/broken one.
export default function FeedCommoditiesPanel({ data }) {
  if (!data || !data.corn?.ready || !data.soybeanMeal?.ready) return null;

  const { corn, soybeanMeal } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', fontFamily: 'Menlo, monospace' }}>
      <CommodityRow
        label="CORN"
        valueText={`$${corn.current.value.toFixed(2)}/bu`}
        momPct={corn.momPct}
        history={corn.history}
      />
      <CommodityRow
        label="SOYBEAN MEAL"
        sublabel="PPI INDEX · 1982=100"
        valueText={soybeanMeal.current.value.toFixed(2)}
        momPct={soybeanMeal.momPct}
        history={soybeanMeal.history}
        isLast
      />
      <div style={{ marginTop: 6, fontSize: '0.58rem', color: '#666' }}>
        CORN {formatMonth(corn.current.referenceDate)} · SOYBEAN MEAL {formatMonth(soybeanMeal.current.referenceDate)}
      </div>
    </div>
  );
}
