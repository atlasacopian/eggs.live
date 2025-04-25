import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts';
import { motion } from 'framer-motion'; // Import motion

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access the full data point
    const price = data.regular; // Assuming we are showing regular price
    const date = new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return (
      <div style={{
        background: '#000',
        color: 'var(--accent-color)', // Accent green
        fontSize: '12px',
        padding: '3px 6px',
        borderRadius: '3px',
        boxShadow: '0 0 8px rgba(255, 193, 7, 0.5)', // Yolk yellow glow
        fontFamily: '"Roboto Mono", monospace'
      }}>
        {`$${price.toFixed(2)} / ${date}`}
      </div>
    );
  }
  return null;
};

// Pulsing Dot Animation CSS
const pulseAnimation = `
  @keyframes pulse {
    0% { r: 4; opacity: 0.6; }
    50% { r: 7; opacity: 1; }
    100% { r: 4; opacity: 0.6; }
  }
  .pulsing-dot {
    animation: pulse 1.5s infinite ease-in-out;
  }
`;

export default function EggPriceChart({ store }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storeId = store?.store_identifier;
    if (!storeId) {
      setError('Store identifier (store_identifier) is missing from store prop.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/simple-store-history?storeIdentifier=${storeId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch history (${res.status}): ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.history)) setHistory(data.history);
        else {
          console.warn('Unexpected response format from history API:', data);
          setHistory([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching price history:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [store?.store_identifier]);

  const lastDataPoint = history.length > 0 ? history[history.length - 1] : null;

  const renderChart = () => (
    // Animate the container
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ width: '100%', height: 100 }} // Reduced height as axes are gone
    >
      <ResponsiveContainer width="100%" height="100%">
        {/* Removed margin as axes/labels are gone */}
        <LineChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          {/* Hide grid */}
          <CartesianGrid stroke="transparent" />
          {/* Hide axes */}
          <XAxis dataKey="date" hide={true} />
          <YAxis hide={true} domain={['dataMin - 1', 'dataMax + 1']} /> 

          {/* Configure tooltip */}
          <Tooltip 
            content={<CustomTooltip />} // Use custom tooltip
            cursor={{ stroke: '#ffffff33', strokeDasharray: '3 3' }} // Faint vertical line
            isAnimationActive={false} // Disable default tooltip animation
            position={{ y: -20 }} // Position tooltip above the line
            offset={10}
          />

          {/* The main data line */}
          <Line 
            type="monotone" 
            dataKey="regular" 
            stroke="#ffffff" 
            strokeWidth={2} 
            dot={false} // Hide default dots
            activeDot={{ r: 5, strokeWidth: 0, fill: '#ffffff' }} // Simple white dot on hover
            isAnimationActive={false} // Disable default line animation
            name="Regular" // Keep name for potential tooltip use
          />

          {/* Pulsing dot for the last point */}
          {lastDataPoint && (
            <ReferenceDot 
              x={lastDataPoint.date} 
              y={lastDataPoint.regular} 
              fill="#ffffff" 
              stroke="none" 
              r={4} 
              className="pulsing-dot" // Apply CSS animation class
              ifOverflow="extendDomain" // Make sure it's visible even if at edge
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );

  return (
    <div style={{ color: '#fff', fontFamily: 'inherit' }}>
      {/* Inject pulsing dot CSS */}
      <style>{pulseAnimation}</style>
      
      {/* Title remains */}
      <h4 style={{ margin: '4px 0 8px 0', color: 'var(--accent-color)', fontSize: '14px', fontWeight: 'normal' }}>
        Price History: {store?.name || store?.store || 'Selected Store'}
      </h4>

      {/* Loading/Error/Empty states */}
      {loading && <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.75 }}>Loading history...</p>}
      {error && <p style={{ margin: 0, fontSize: '0.8rem', color: '#ff4d4d' }}>Error: {error}</p>}
      {!loading && !error && history.length === 0 && (
        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.75 }}>No price history available.</p>
      )}

      {/* Render the chart container */}
      {!loading && !error && history.length > 0 && renderChart()}
    </div>
  );
} 