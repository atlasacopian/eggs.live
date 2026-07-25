'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

// Custom tooltip for price and date
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { value } = payload[0];
    const dateStr = new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return (
      <div className="bg-black text-white px-2 py-1 rounded shadow-lg">
        <div>{`$${value.toFixed(2)}`}</div>
        <div className="text-xs text-gray-400">{dateStr}</div>
      </div>
    );
  }
  return null;
};

export default function EggPriceChart({ selectedStore, store, highlight = false, preview = false, priceType = 'regular', isMobile = false, zipCode = null }) {
  // Use selectedStore if provided, otherwise fall back to store prop
  const currentStore = selectedStore || store;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setHistory(data.history || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentStore?.store_identifier]);

  const strokeColor = highlight ? '#ffc107' : '#ffffff';
  const dataKey = priceType;

  // Compute dynamic domain for Y axis based on history data
  const values = history.map(d => d[dataKey]).filter(v => typeof v === 'number');
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const domainMin = minVal - 0.2;
  const domainMax = maxVal + 0.2;

  // Compute ticks: first, middle, last
  const dates = history.map(d => d.date);
  const ticks = history.length > 2
    ? [dates[0], dates[Math.floor(dates.length / 2)], dates[dates.length - 1]]
    : dates;

  // Full view: grow with viewport so the chart fills tall terminal tiles (was fixed 160px).
  const fullChartOuterStyle = preview
    ? { width: '100%', height: 24 }
    : {
        width: '100%',
        height: 'clamp(280px, calc(100vh - 260px), 720px)',
      };

  // Unified chart renderer for both preview and full views
  const ChartRenderer = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: preview ? 0.3 : 0.5 }}
        style={fullChartOuterStyle}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={history}
            margin={{ top: 0, right: 0, left: 0, bottom: 20 }}
          >
            {/* Render subtle grid only in full view */}
            {!preview && <CartesianGrid vertical={false} stroke="#444" strokeOpacity={0.1} />}
            <XAxis
              dataKey="date"
              type="category"
              scale="point"
              padding={{ left: 0, right: 0 }}
              ticks={ticks}
              tickFormatter={!preview ? t => {
                const d = new Date(t);
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const yy = String(d.getFullYear() % 100).padStart(2, '0');
                return `${mm}/${dd}/${yy}`;
              } : undefined}
              axisLine={false}
              tickLine={false}
              hide={preview}
              stroke="#666"
              tick={{ fontSize: 10, fill: '#666', dy: 2 }}
              tickMargin={8}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              axisLine={false}
              tickLine={false}
              hide={preview}
              stroke="#666"
              tick={{ fontSize: 10, fill: '#666', dx: -4 }}
              tickMargin={8}
              tickFormatter={!preview ? v => `$${v.toFixed(2)}` : undefined}
            />
            {/* Tooltip only in full view */}
            {!preview && <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#888', strokeDasharray: '3 3' }} />}
            {/* Show both lines in full view, only one in preview */}
            <Line
              type="linear"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={preview ? 1 : 2}
              dot={preview ? false : { r: 4 }}
              activeDot={preview ? false : { r: 6 }}
              isAnimationActive={true}
              animationDuration={preview ? 800 : 1500}
              animationEasing="ease-in-out"
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
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

  return <ChartRenderer />;
}