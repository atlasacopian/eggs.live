'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { SIGNAL, RED } from '../lib/terminalTheme';

const fmt = v => (typeof v === 'number' ? `$${v.toFixed(2)}` : '—');

// Tooltip spells out all three numbers for the hovered day, labelled, so
// it's never ambiguous which line is which.
const CustomTooltip = ({ active, payload, label, priceType }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (typeof d[priceType] !== 'number') return null;
  const dateStr = new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const row = (name, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: '#888' }}>{name}</span>
      <span style={{ color, fontWeight: 700 }}>{fmt(value)}</span>
    </div>
  );
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #444', padding: '5px 8px', fontFamily: 'Menlo, monospace', fontSize: '0.7rem', minWidth: 140 }}>
      <div style={{ fontSize: '0.62rem', color: '#888', marginBottom: 3 }}>{dateStr}</div>
      {row('Cheapest', d[priceType], '#fff')}
      {row('Average', d[`${priceType}_avg`], '#aaa')}
      {row('Highest', d[`${priceType}_max`], '#777')}
    </div>
  );
};

// Each value below the chart's summary strip carries a swatch drawn the same
// way as its series in the chart, so the strip doubles as the legend.
const Swatch = ({ kind, color }) => {
  const base = { display: 'inline-block', width: 14, marginRight: 5, verticalAlign: 'middle' };
  if (kind === 'band') return <span style={{ ...base, height: 8, background: color, opacity: 0.25 }} />;
  return <span style={{ ...base, height: 0, borderTop: `2px ${kind === 'dashed' ? 'dashed' : 'solid'} ${color}` }} />;
};

// Some stores have real rows missing entirely for weeks/months at a time
// (not just an explicit null placeholder) when a scrape has been failing.
// Recharts' category/point x-axis connects adjacent array entries with a
// straight line regardless of the real calendar gap between them, which
// turns "we have no data for months" into a misleadingly smooth diagonal
// trend line. Insert a synthetic null break-point wherever consecutive
// entries are more than GAP_THRESHOLD_DAYS apart so the line visibly breaks.
const GAP_THRESHOLD_DAYS = 14;
function insertGapBreaks(history) {
  if (history.length < 2) return history;
  const out = [history[0]];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    const daysBetween = (new Date(curr.date) - new Date(prev.date)) / 86_400_000;
    if (daysBetween > GAP_THRESHOLD_DAYS) {
      const midpoint = new Date((new Date(prev.date).getTime() + new Date(curr.date).getTime()) / 2).toISOString();
      out.push({ date: midpoint, regular: null, regular_avg: null, regular_max: null, organic: null, organic_avg: null, organic_max: null });
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
  { label: 'ALL', days: null },
];

export default function EggPriceChart({ selectedStore, store, highlight = false, preview = false, priceType: priceTypeProp, onPriceTypeChange, isMobile = false, zipCode = null }) {
  // Use selectedStore if provided, otherwise fall back to store prop
  const currentStore = selectedStore || store;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Fall back to internal state if the parent doesn't control priceType, so
  // this component still works (e.g. in preview mode) without wiring.
  const [internalPriceType, setInternalPriceType] = useState('regular');
  const requestedPriceType = priceTypeProp ?? internalPriceType;
  const setPriceType = onPriceTypeChange ?? setInternalPriceType;
  const [range, setRange] = useState('3M');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const id = currentStore?.store_identifier;
        if (!id) {
          // No store identifier: do not load history
          setHistory([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        const res = await fetch(`/api/simple-store-history?storeIdentifier=${id}`);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        setHistory(insertGapBreaks(data.history || []));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentStore?.store_identifier]);

  // Some chains never carry one of the two types at all (Erewhon only stocks
  // organic dozens), so only offer the types this store has any history for,
  // and fall back to the one it does have rather than showing an empty chart.
  // The parent's shared priceType is left untouched so switching back to a
  // Kroger/Target store restores the user's pick.
  const availableTypes = ['regular', 'organic'].filter(t => history.some(d => typeof d[t] === 'number'));
  const priceType = availableTypes.includes(requestedPriceType) || !availableTypes.length
    ? requestedPriceType
    : availableTypes[0];

  const strokeColor = highlight ? SIGNAL : '#ffffff';
  const dataKey = priceType;

  const selectedRangeDays = RANGES.find(r => r.label === range)?.days;
  const visibleHistory = selectedRangeDays
    ? history.filter(d => Date.now() - new Date(d.date).getTime() <= selectedRangeDays * 86_400_000)
    : history;

  // Compute dynamic domain for Y axis based on the visible window only, so
  // zooming into a range also rescales the price axis to that window. Padding
  // is proportional to the actual range (10%, floor $0.15) rather than a flat
  // ±$0.20 - a flat pad swallows most of the chart when a store's price only
  // moves a few cents, and barely registers when it moves several dollars.
  const values = visibleHistory.map(d => d[dataKey]).filter(v => typeof v === 'number');
  // Axis has to fit the whole band, not just the cheapest line.
  const axisValues = visibleHistory
    .flatMap(d => (typeof d[dataKey] === 'number' ? [d[dataKey], d[`${dataKey}_max`]] : []))
    .filter(v => typeof v === 'number');
  const minVal = axisValues.length ? Math.min(...axisValues) : 0;
  const maxVal = axisValues.length ? Math.max(...axisValues) : 1;
  const pad = Math.max((maxVal - minVal) * 0.1, 0.15);
  const domainMin = Math.max(0, minVal - pad);
  const domainMax = maxVal + pad;

  // Compute ticks: first, middle, last
  const dates = visibleHistory.map(d => d.date);
  const ticks = visibleHistory.length > 2
    ? [dates[0], dates[Math.floor(dates.length / 2)], dates[dates.length - 1]]
    : dates;

  // Full view: grow with viewport so the chart fills tall terminal tiles (was fixed 160px).
  const fullChartOuterStyle = preview
    ? { width: '100%', height: 24 }
    : {
        width: '100%',
        height: 'clamp(240px, calc(100vh - 340px), 640px)',
      };

  const controlBtnStyle = (active) => ({
    background: 'transparent',
    border: 'none',
    color: active ? SIGNAL : '#666',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.65rem',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    padding: '3px 6px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  });

  // Dots get overwhelming past a few dozen points (a full year of daily
  // minimums is 365 dots) - only draw them once the visible window is small
  // enough for each one to be individually readable.
  const showDots = !preview && visibleHistory.length <= 60;

  const controlBar = !preview && (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
      <div style={{ display: 'flex' }}>
        {(availableTypes.length ? availableTypes : ['regular', 'organic']).map(t => (
          <button key={t} style={controlBtnStyle(priceType === t)} onClick={() => setPriceType(t)}>
            {priceType === t ? `[ ${t} ]` : t}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        {RANGES.map(r => (
          <button key={r.label} style={controlBtnStyle(range === r.label)} onClick={() => setRange(r.label)}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );

  // Latest day with a price for the selected type - the headline numbers.
  const latest = [...history].reverse().find(d => typeof d[dataKey] === 'number');
  const AVG_COLOR = '#9a9a9a';
  const summaryStrip = !preview && latest && (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '6px 18px', padding: '2px 6px 8px', fontFamily: 'Menlo, monospace' }}>
      <div>
        <div style={{ fontSize: '0.58rem', color: '#888', letterSpacing: '0.06em' }}><Swatch kind="solid" color={strokeColor} />CHEAPEST</div>
        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{fmt(latest[dataKey])}</div>
      </div>
      {typeof latest[`${dataKey}_avg`] === 'number' && (
        <div>
          <div style={{ fontSize: '0.58rem', color: '#888', letterSpacing: '0.06em' }}><Swatch kind="dashed" color={AVG_COLOR} />AVERAGE</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#bbb', lineHeight: 1.2 }}>{fmt(latest[`${dataKey}_avg`])}</div>
        </div>
      )}
      {typeof latest[`${dataKey}_max`] === 'number' && (
        <div>
          <div style={{ fontSize: '0.58rem', color: '#888', letterSpacing: '0.06em' }}><Swatch kind="band" color={strokeColor} />RANGE</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#888', lineHeight: 1.2 }}>{fmt(latest[dataKey])}–{fmt(latest[`${dataKey}_max`])}</div>
        </div>
      )}
      <div style={{ flexBasis: '100%', fontSize: '0.6rem', color: '#666' }}>
        {currentStore?.name ? `${currentStore.name} · ` : ''}{dataKey} 12-egg cartons · {new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </div>
  );

  // Unified chart renderer for both preview and full views
  const ChartRenderer = () => {
    return (
      <>
        {controlBar}
        {summaryStrip}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: preview ? 0.3 : 0.5 }}
          style={fullChartOuterStyle}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={visibleHistory}
              margin={{ top: 8, right: 12, left: 0, bottom: 20 }}
            >
              {/* Render subtle grid only in full view */}
              {!preview && <CartesianGrid vertical={false} stroke="#444" strokeOpacity={0.25} />}
              {/* Shaded band from the cheapest to the most expensive dozen. */}
              {!preview && (
                <Area
                  type="linear"
                  dataKey={d => (typeof d[dataKey] === 'number' && typeof d[`${dataKey}_max`] === 'number' ? [d[dataKey], d[`${dataKey}_max`]] : null)}
                  stroke="none"
                  fill={strokeColor}
                  fillOpacity={0.06}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}
              {!preview && (
                <Line
                  type="linear"
                  dataKey={`${dataKey}_max`}
                  stroke="#555"
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}
              {!preview && (
                <Line
                  type="linear"
                  dataKey={`${dataKey}_avg`}
                  stroke={AVG_COLOR}
                  strokeWidth={1.25}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              )}
              <XAxis
                dataKey="date"
                type="category"
                scale="point"
                padding={{ left: 8, right: 8 }}
                ticks={ticks}
                tickFormatter={!preview ? t => {
                  const d = new Date(t);
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  return `${mm}/${dd}`;
                } : undefined}
                axisLine={{ stroke: '#444' }}
                tickLine={false}
                hide={preview}
                stroke="#888"
                tick={{ fontSize: 11, fill: '#aaa', dy: 4 }}
                tickMargin={8}
              />
              <YAxis
                domain={[domainMin, domainMax]}
                axisLine={{ stroke: '#444' }}
                tickLine={false}
                hide={preview}
                stroke="#888"
                tick={{ fontSize: 11, fill: '#aaa', dx: -4 }}
                tickMargin={8}
                tickFormatter={!preview ? v => `$${v.toFixed(2)}` : undefined}
                width={60}
              />
              {/* Tooltip only in full view */}
              {!preview && <Tooltip content={<CustomTooltip priceType={dataKey} />} cursor={{ stroke: '#888', strokeDasharray: '3 3' }} />}
              {/* Show both lines in full view, only one in preview */}
              <Line
                type="linear"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={preview ? 1 : 2}
                dot={showDots ? { r: 3 } : false}
                activeDot={preview ? false : { r: 6 }}
                // ChartRenderer remounts on every parent render (e.g. hovering
                // the store list), which restarted the draw-in mid-way and left
                // the line visibly cut off - animate only the small preview.
                isAnimationActive={preview}
                animationDuration={800}
                animationEasing="ease-in-out"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </>
    );
  };

  // Render the full chart directly (parent panel provides background and padding)
  if (loading) return <p className="text-gray-400 text-sm">Loading history...</p>;
  if (error) return <p className="text-red-500 text-sm">Error: {error}</p>;
  // If preview and no history, render nothing. Otherwise show the standard message.
  if (!history.length) {
    if (preview) return null;
    return (
      <p style={{ color: '#888', fontSize: '0.85rem', padding: '8px 10px' }}>
        {zipCode ? `No data available for ${zipCode}.` : 'No price history available.'}
      </p>
    );
  }

  // Some data exists overall, just none within the zoomed-in range selected.
  // Checked against actual values, not visibleHistory.length - a gap-break
  // marker (see insertGapBreaks) can land inside the window with no real
  // price attached, which would otherwise slip past a plain length check.
  if (!preview && values.length === 0) {
    return (
      <>
        {controlBar}
        <p style={{ color: '#888', fontSize: '0.85rem', padding: '8px 10px' }}>
          No data in this range - try a wider one.
        </p>
      </>
    );
  }

  return <ChartRenderer />;
}