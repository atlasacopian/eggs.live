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

export default function EggPriceChart({ store, highlight = false }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const id = store?.store_identifier;
        if (!id) throw new Error('Store identifier missing');
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
  }, [store?.store_identifier]);

  const strokeColor = highlight ? '#ffc107' : '#ffffff';
  const dataKey = 'regular';

  // Compute ticks: first, middle, last
  const dates = history.map(d => d.date);
  const ticks = history.length > 2
    ? [dates[0], dates[Math.floor(dates.length / 2)], dates[dates.length - 1]]
    : dates;

  const renderChart = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid vertical={false} stroke="#444" strokeOpacity={0.2} />
          <ReferenceLine y={7} stroke="#555" strokeDasharray="3 3" />
          <ReferenceLine y={8.5} stroke="#555" strokeDasharray="3 3" />
          <ReferenceLine y={10} stroke="#555" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={t => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            axisLine={false}
            tickLine={false}
            stroke="#aaa"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={[7, 10]}
            axisLine={false}
            tickLine={false}
            stroke="#aaa"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#888', strokeDasharray: '3 3' }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );

  if (loading) return <p className="text-gray-400 text-sm">Loading history...</p>;
  if (error) return <p className="text-red-500 text-sm">Error: {error}</p>;
  if (!history.length) return <p className="text-gray-400 text-sm">No price history available.</p>;

  return (
    <div className="bg-black p-4 rounded">
      <h4 className="text-yellow-400 text-sm mb-2">
        Price History: {store?.name || store?.store || 'Store'}
      </h4>
      {renderChart()}
    </div>
  );
}