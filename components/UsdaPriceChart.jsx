import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabaseBrowser } from '../lib/supabase'; // Assuming lib/supabase.js

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

  useEffect(() => {
    // Function to fetch and update chart data using API endpoint
    const fetchData = async () => {
      console.log('🔄 Fetching fresh USDA data from API at:', new Date().toISOString());
      setLoading(true);
      setError(null);

      try {
        // Use the API endpoint instead of direct database queries
        const response = await fetch('/api/national-egg-stats');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('API Response:', data);

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
        
        console.log('Converted Regular Data:', regularData);
        console.log('Converted Organic Data:', organicData);
        
        const formattedData = formatDataForChart(regularData, organicData);
        console.log('All USDA Chart Data:', formattedData);
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
      console.log('🔄 Periodic refresh of USDA data');
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

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="date" 
          stroke="#ccc"
          tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
          minTickGap={30} // Adjust to show fewer labels if crowded
        />
          <YAxis stroke="#ccc" domain={[ 'auto', 'auto' ]}>
        </YAxis>
        <Tooltip 
            wrapperStyle={{ backgroundColor: '#222', border: '1px solid #555' }}
            contentStyle={{ backgroundColor: '#222', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value) => typeof value === 'number' ? `$${value.toFixed(2)}` : value}
        />
        <Legend wrapperStyle={{ color: '#fff' }} />
        {/* Render Regular only if at least one data point exists */}
        {chartData.some(d => d.Regular !== undefined) && (
          <Line type="monotone" dataKey="Regular" stroke="#00b7ff" dot={false} strokeWidth={2} name="Regular (Natl Avg)" connectNulls={true} />
        )}
        {chartData.some(d => d.Organic !== undefined) && ( // Only render Organic line if data exists
            <Line type="monotone" dataKey="Organic" stroke="#fd7e14" dot={false} strokeWidth={2} name="Organic (Natl Avg)" connectNulls={true} />
        )}
      </LineChart>
      </ResponsiveContainer>
      <div style={{ fontSize: '0.6em', color: '#666', marginTop: 4, textAlign: 'right' }}>
        Source: USDA{lastUpdated ? ` • Last updated: ${new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
      </div>
    </div>
  );
} 