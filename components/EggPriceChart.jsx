'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { SIGNAL, RED } from '../lib/terminalTheme';

// Custom tooltip for price and date
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { value } = payload[0];
    const dateStr = new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return (
      <div style={{ background: '#0a0a0a', border: `1px solid ${SIGNAL}`, padding: '4px 8px', fontFamily: 'Menlo, monospace' }}>
        <div style={{ color: '#fff', fontWeight: 700 }}>{`$${value.toFixed(2)}`}</div>
        <div style={{ fontSize: '0.65rem', color: '#888' }}>{dateStr}</div>
      </div>
    );
  }
  return null;
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
      out.push({ date: midpoint, regular: null, organic: null });
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
  const priceType = priceTypeProp ?? internalPriceType;
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
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 1;
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
        height: 'clamp(280px, calc(100vh - 260px), 720px)',
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
        <button style={controlBtnStyle(priceType === 'regular')} onClick={() => setPriceType('regular')}>
          {priceType === 'regular' ? '[ Regular ]' : 'Regular'}
        </button>
        <button style={controlBtnStyle(priceType === 'organic')} onClick={() => setPriceType('organic')}>
          {priceType === 'organic' ? '[ Organic ]' : 'Organic'}
        </button>
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

  // Unified chart renderer for both preview and full views
  const ChartRenderer = () => {
    return (
      <>
        {controlBar}
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
              <defs>
                <linearGradient id="eggPriceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {/* Render subtle grid only in full view */}
              {!preview && <CartesianGrid vertical={false} stroke="#444" strokeOpacity={0.25} />}
              {!preview && (
                <Area
                  type="linear"
                  dataKey={dataKey}
                  stroke="none"
                  fill="url(#eggPriceAreaGradient)"
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
                width={52}
              />
              {/* Tooltip only in full view */}
              {!preview && <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#888', strokeDasharray: '3 3' }} />}
              {/* Show both lines in full view, only one in preview */}
              <Line
                type="linear"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={preview ? 1 : 2}
                dot={showDots ? { r: 3 } : false}
                activeDot={preview ? false : { r: 6 }}
                isAnimationActive={true}
                animationDuration={preview ? 800 : 600}
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