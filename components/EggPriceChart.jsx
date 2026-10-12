'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Segmented from './Segmented.jsx';
import { SANS, MONO, HAIRLINE, TEXT, TEXT_2, TEXT_3, TYPE_COLOR, TYPE_LABEL } from '../lib/terminalTheme';

const fmt = v => (typeof v === 'number' ? `$${v.toFixed(2)}` : '—');
const AVG_COLOR = TEXT_2;

// Tooltip spells out all three numbers for the hovered day, labelled, so
// it's never ambiguous which line is which.
const CustomTooltip = ({ active, payload, label, priceType }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (typeof d[priceType] !== 'number') return null;
  const dateStr = new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const row = (name, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
      <span style={{ color: TEXT_3, fontFamily: SANS }}>{name}</span>
      <span style={{ color, fontWeight: 600 }}>{fmt(value)}</span>
    </div>
  );
  return (
    <div style={{ background: 'rgba(28,28,30,0.96)', border: `1px solid ${HAIRLINE}`, borderRadius: 10, padding: '8px 10px', fontFamily: MONO, fontSize: 12, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: 11, color: TEXT_3, marginBottom: 5, fontFamily: SANS }}>{dateStr}</div>
      {row('Cheapest', d[priceType], TYPE_COLOR[priceType])}
      {row('Average', d[`${priceType}_avg`], AVG_COLOR)}
      {row('Highest', d[`${priceType}_max`], TEXT_3)}
    </div>
  );
};

// Each figure in the stats row carries a swatch drawn like its chart series,
// so the stats row doubles as the legend.
const Swatch = ({ kind, color }) => {
  const base = { display: 'inline-block', width: 12, marginRight: 6, verticalAlign: 'middle' };
  if (kind === 'band') return <span style={{ ...base, height: 8, borderRadius: 2, background: color, opacity: 0.3 }} />;
  return <span style={{ ...base, height: 0, borderTop: `2px ${kind === 'dashed' ? 'dashed' : 'solid'} ${color}` }} />;
};

const Stat = ({ swatch, label, value, big, color }) => (
  <div>
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_3, marginBottom: 3 }}>
      {swatch}{label}
    </div>
    <div style={{ fontFamily: MONO, fontSize: big ? 28 : 16, fontWeight: big ? 600 : 500, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
      {value}
    </div>
  </div>
);

// Some stores have real rows missing for weeks at a time when a scrape was
// failing. Insert a null break-point wherever consecutive entries are more
// than GAP_THRESHOLD_DAYS apart so the line visibly breaks instead of drawing
// a misleadingly smooth diagonal across the gap.
const GAP_THRESHOLD_DAYS = 14;
const EMPTY_POINT = { regular: null, regular_avg: null, regular_max: null, organic: null, organic_avg: null, organic_max: null };
function insertGapBreaks(history) {
  if (history.length < 2) return history;
  const out = [history[0]];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    const daysBetween = (new Date(curr.date) - new Date(prev.date)) / 86_400_000;
    if (daysBetween > GAP_THRESHOLD_DAYS) {
      const midpoint = new Date((new Date(prev.date).getTime() + new Date(curr.date).getTime()) / 2).toISOString();
      out.push({ date: midpoint, ...EMPTY_POINT });
    }
    out.push(curr);
  }
  return out;
}

const RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: null },
];

export default function EggPriceChart({ selectedStore, store, preview = false, priceType: priceTypeProp, onPriceTypeChange, isMobile = false, zipCode = null }) {
  const currentStore = selectedStore || store;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Fall back to internal state if the parent doesn't control priceType.
  const [internalPriceType, setInternalPriceType] = useState('regular');
  const requestedPriceType = priceTypeProp ?? internalPriceType;
  const setPriceType = onPriceTypeChange ?? setInternalPriceType;
  const [range, setRange] = useState('3M');

  useEffect(() => {
    const id = currentStore?.store_identifier;
    if (!id) { setHistory([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/simple-store-history?storeIdentifier=${id}`)
      .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
      .then(data => { if (!cancelled) setHistory(insertGapBreaks(data.history || [])); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentStore?.store_identifier]);

  // Some chains never carry one of the two types (Erewhon only stocks organic
  // dozens) - only offer the types this store has history for, and fall back
  // to the one it has. The parent's priceType is left untouched so switching
  // back to another store restores the user's pick.
  const availableTypes = ['regular', 'organic'].filter(t => history.some(d => typeof d[t] === 'number'));
  const priceType = availableTypes.includes(requestedPriceType) || !availableTypes.length
    ? requestedPriceType
    : availableTypes[0];
  const color = TYPE_COLOR[priceType];

  const selectedRangeDays = RANGES.find(r => r.label === range)?.days;
  const visibleHistory = selectedRangeDays
    ? history.filter(d => Date.now() - new Date(d.date).getTime() <= selectedRangeDays * 86_400_000)
    : history;

  // Y axis fits the visible window's whole band (cheapest to highest), with
  // proportional padding (10%, floor $0.15).
  const values = visibleHistory.map(d => d[priceType]).filter(v => typeof v === 'number');
  const axisValues = visibleHistory
    .flatMap(d => (typeof d[priceType] === 'number' ? [d[priceType], d[`${priceType}_max`]] : []))
    .filter(v => typeof v === 'number');
  const minVal = axisValues.length ? Math.min(...axisValues) : 0;
  const maxVal = axisValues.length ? Math.max(...axisValues) : 1;
  const pad = Math.max((maxVal - minVal) * 0.1, 0.15);
  const domain = [Math.max(0, minVal - pad), maxVal + pad];

  const dates = visibleHistory.map(d => d.date);
  const ticks = visibleHistory.length > 2 ? [dates[0], dates[Math.floor(dates.length / 2)], dates[dates.length - 1]] : dates;
  const latest = [...history].reverse().find(d => typeof d[priceType] === 'number');

  const message = text => <p style={{ color: TEXT_3, fontSize: 13, fontFamily: SANS, padding: '12px 2px', margin: 0 }}>{text}</p>;

  if (loading) return preview ? null : message('Loading price history…');
  if (error) return preview ? null : message(`Couldn't load price history (${error}).`);
  if (!history.length) return preview ? null : message(zipCode ? `No price history for this store yet.` : 'No price history available.');

  if (preview) {
    return (
      <div style={{ width: '100%', height: 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleHistory}>
            <YAxis hide domain={domain} />
            <Line type="linear" dataKey={priceType} stroke={color} strokeWidth={1} dot={false} isAnimationActive={false} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: SANS }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {availableTypes.length > 1 ? (
          <Segmented size="sm" ariaLabel="Egg type" value={priceType} onChange={setPriceType}
            options={availableTypes.map(t => ({ value: t, label: TYPE_LABEL[t] }))} />
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>
            {TYPE_LABEL[priceType]} only
          </span>
        )}
        <Segmented size="sm" ariaLabel="Time range" value={range} onChange={setRange}
          options={RANGES.map(r => ({ value: r.label, label: r.label }))} />
      </div>

      {latest && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 18 : 28, flexWrap: 'wrap', marginBottom: 14 }}>
          <Stat big swatch={<Swatch kind="solid" color={color} />} label="Cheapest" value={fmt(latest[priceType])} color={TEXT} />
          {typeof latest[`${priceType}_avg`] === 'number' && (
            <Stat swatch={<Swatch kind="dashed" color={AVG_COLOR} />} label="Average" value={fmt(latest[`${priceType}_avg`])} color={TEXT_2} />
          )}
          {typeof latest[`${priceType}_max`] === 'number' && (
            <Stat swatch={<Swatch kind="band" color={color} />} label="Range" value={`${fmt(latest[priceType])}–${fmt(latest[`${priceType}_max`])}`} color={TEXT_3} />
          )}
        </div>
      )}

      {values.length === 0 ? message('No prices in this range — try a longer one.') : (
        <div style={{ width: '100%', height: isMobile ? 220 : 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visibleHistory} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={HAIRLINE} />
              {/* Band from the cheapest to the most expensive dozen. */}
              <Area
                type="linear"
                dataKey={d => (typeof d[priceType] === 'number' && typeof d[`${priceType}_max`] === 'number' ? [d[priceType], d[`${priceType}_max`]] : null)}
                stroke="none"
                fill={color}
                fillOpacity={0.035}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line type="linear" dataKey={`${priceType}_max`} stroke="#3a3a3c" strokeWidth={1} dot={false} activeDot={false} connectNulls={false} isAnimationActive={false} />
              <Line type="linear" dataKey={`${priceType}_avg`} stroke={AVG_COLOR} strokeWidth={1.25} strokeDasharray="4 3" dot={false} activeDot={false} connectNulls={false} isAnimationActive={false} />
              <Line
                type="linear"
                dataKey={priceType}
                stroke={color}
                strokeWidth={2}
                dot={visibleHistory.length <= 45 ? { r: 2.5, strokeWidth: 0, fill: color } : false}
                activeDot={{ r: 5, strokeWidth: 0, fill: color }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <XAxis
                dataKey="date"
                type="category"
                scale="point"
                padding={{ left: 6, right: 6 }}
                ticks={ticks}
                tickFormatter={t => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10.5, fill: TEXT_3, fontFamily: MONO }}
                tickMargin={10}
              />
              <YAxis
                domain={domain}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10.5, fill: TEXT_3, fontFamily: MONO }}
                tickFormatter={v => `$${v.toFixed(2)}`}
                width={52}
              />
              <Tooltip content={<CustomTooltip priceType={priceType} />} cursor={{ stroke: TEXT_3, strokeDasharray: '3 3' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
