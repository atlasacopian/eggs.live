import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabaseBrowser } from '../lib/supabase'; // Assuming lib/supabase.js

const formatDataForChart = (regularData, organicData) => {
  const combined = {};

  regularData.forEach(item => {
    const date = item.report_start_date;
    if (!combined[date]) {
      combined[date] = { date };
    }
    combined[date].Regular = item.price;
  });

  organicData.forEach(item => {
    const date = item.report_start_date;
    if (!combined[date]) {
      combined[date] = { date };
    }
    combined[date].Organic = item.price;
  });

  return Object.values(combined).sort((a, b) => new Date(a.date) - new Date(b.date));
};

export default function UsdaPriceChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const sb = supabaseBrowser();

      try {
        const { data: regularData, error: regularError } = await sb
          .from('usda_weekly_egg_prices')
          .select('report_start_date, price')
          .eq('product_type', 'grd a lrg') // Target specific product type for regular
          .order('report_start_date', { ascending: true });

        if (regularError) throw regularError;

        const { data: organicData, error: organicError } = await sb
          .from('usda_weekly_egg_prices')
          .select('report_start_date, price')
          .eq('product_type', 'organic') // Target 'organic'
          .order('report_start_date', { ascending: true });

        if (organicError) throw organicError;
        
        // console.log('Regular USDA Data:', regularData);
        // console.log('Organic USDA Data:', organicData);

        if ((!regularData || regularData.length === 0) && (!organicData || organicData.length === 0)) {
          // console.log('No USDA data found for chart.');
        }
        
        setChartData(formatDataForChart(regularData || [], organicData || []));

      } catch (err) {
        console.error('Error fetching USDA price data:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="date" 
          stroke="#ccc"
          tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
          minTickGap={30} // Adjust to show fewer labels if crowded
        />
        <YAxis stroke="#ccc" domain={['auto', 'auto']}>
        </YAxis>
        <Tooltip 
            wrapperStyle={{ backgroundColor: '#222', border: '1px solid #555' }}
            contentStyle={{ backgroundColor: '#222', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value) => typeof value === 'number' ? `$${value.toFixed(2)}` : value}
        />
        <Legend wrapperStyle={{ color: '#fff' }} />
        <Line type="monotone" dataKey="Regular" stroke="#00ff00" dot={false} strokeWidth={2} name="Regular (Natl Avg)" />
        {chartData.some(d => d.Organic !== undefined) && ( // Only render Organic line if data exists
            <Line type="monotone" dataKey="Organic" stroke="#ffc107" dot={false} strokeWidth={2} name="Organic (Natl Avg)" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
} 