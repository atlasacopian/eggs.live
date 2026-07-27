import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { supabaseBrowser } from '../lib/supabase'; // Assuming lib/supabase.js
import { citationStyle } from '../lib/terminalTheme';

const WHITE = '#fff';

const formatDataForChart = (regularData, organicData) => {
  const combined = {};

  regularData.forEach(item => {
    const date = item.report_end_date;
    if (!combined[date]) {
      combined[date] = { date };
    }
    combined[date].Regular = item.price;
  });

  organicData.forEach(item => {
    const date = item.report_end_date;
    if (!combined[date]) {
      combined[date] = { date };
    }
    combined[date].Organic = item.price;
  });

  return Object.values(combined).sort((a, b) => new Date(a.date) - new Date(b.date));
};

export default function UsdaPriceChart() {
  const [chartData, setChartData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceType, setPriceType] = useState('Regular');

  useEffect(() => {
    // Function to fetch and update chart data using API endpoint
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use the API endpoint instead of direct database queries
        const response = await fetch('/api/national-egg-stats');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (!data.priceHistoryRegular || !data.priceHistoryOrganic) {
          throw new Error('Invalid API response format');
        }

        // Convert API data to chart format
        const regularData = data.priceHistoryRegular.map(item => ({
          report_end_date: item.date,
          price: item.value
        }));

        const organicData = data.priceHistoryOrganic.map(item => ({
          report_end_date: item.date,
          price: item.value
        }));

        const formattedData = formatDataForChart(regularData, organicData);
        setChartData(formattedData);
        if (formattedData.length) {
          setLastUpdated(formattedData[formattedData.length - 1].date);
        }

      } catch (err) {
        console.error('Error fetching USDA price data:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up periodic refresh every 5 minutes to get latest data
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000); // 5 minutes

    // Clean up interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []); // Force refresh every time component mounts

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading USDA price data...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
  }

  if (chartData.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>No USDA price data available for the selected types.</div>;
  }

  // Explicit padded domain from the real data range for the selected series
  // only - recharts' 'auto'/'auto' was collapsing everything near the top of
  // the chart with only one legible tick once the panel got shorter, and
  // scaling to whichever line isn't shown just wastes vertical range.
  const values = chartData.map(d => d[priceType]).filter(v => typeof v === 'number');
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 10;
  const pad = (maxVal - minVal) * 0.1 || 0.5;
  const domainMin = Math.max(0, minVal - pad);
  const domainMax = maxVal + pad;

  const controlBtnStyle = (active) => ({
    background: 'transparent',
    border: 'none',
    color: active ? WHITE : '#666',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.65rem',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    padding: '2px 6px 4px',
    textTransform: 'uppercase',
  });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div>
        <button style={controlBtnStyle(priceType === 'Regular')} onClick={() => setPriceType('Regular')}>
          {priceType === 'Regular' ? '[ Regular ]' : 'Regular'}
        </button>
        <button style={controlBtnStyle(priceType === 'Organic')} onClick={() => setPriceType('Organic')}>
          {priceType === 'Organic' ? '[ Organic ]' : 'Organic'}
        </button>
      </div>
      <ResponsiveContainer width="100%" height="76%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="#333" strokeOpacity={0.4} />
          <XAxis
            dataKey="date"
            stroke="#444"
            tick={{ fontSize: 11, fill: '#aaa' }}
            tickLine={false}
            tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            minTickGap={40}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            stroke="#444"
            tick={{ fontSize: 11, fill: '#aaa' }}
            tickLine={false}
            tickFormatter={v => `$${v.toFixed(2)}`}
            width={46}
          />
          <Tooltip
            wrapperStyle={{ backgroundColor: '#000', border: `1px solid ${WHITE}` }}
            contentStyle={{ backgroundColor: '#000', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value) => typeof value === 'number' ? `$${value.toFixed(2)}` : value}
          />
          <Line type="linear" dataKey={priceType} stroke={WHITE} dot={false} strokeWidth={1.5} name={`${priceType} (Natl Avg)`} connectNulls={true} />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ ...citationStyle, marginTop: 2, textAlign: 'right' }}>
        Source: USDA{lastUpdated ? ` · Last updated: ${new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
      </div>
    </div>
  );
}
