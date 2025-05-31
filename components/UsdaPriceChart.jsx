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
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Supabase client
    const sb = supabaseBrowser();
    // Function to fetch and update chart data
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch regular (covering both 'grd a lrg' and 'regular') and organic prices in parallel
        const [{ data: regularData, error: regularError }, { data: organicData, error: organicError }] = await Promise.all([
          sb
            .from('usda_weekly_egg_prices')
            .select('report_start_date, price')
            .in('product_type', ['grd a lrg', 'regular'])
            .order('report_start_date', { ascending: true }),
          sb
            .from('usda_weekly_egg_prices')
            .select('report_start_date, price')
            .eq('product_type', 'organic')
            .order('report_start_date', { ascending: true })
        ]);

        if (regularError) throw regularError;
        if (organicError) throw organicError;
        
        console.log('Fetched Regular USDA Data:', regularData);
        console.log('Fetched Organic USDA Data:', organicData);

        if ((!regularData || regularData.length === 0) && (!organicData || organicData.length === 0)) {
          // console.log('No USDA data found for chart.');
        }
        
        const formattedData = formatDataForChart(regularData || [], organicData || []);
        const currentYear = new Date().getFullYear();
        const filteredData = formattedData.filter(item => new Date(item.date).getFullYear() === currentYear);
        console.log(`Filtered Chart Data for ${currentYear}:`, filteredData);
        setChartData(filteredData);
        if (filteredData.length) {
          setLastUpdated(filteredData[filteredData.length - 1].date);
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

    // Subscribe to new USDA data inserts and refresh chart when data changes
    const channel = sb
      .channel('usda-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'usda_weekly_egg_prices' }, () => {
        console.log('Real-time USDA update received, refreshing data');
        fetchData();
      })
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      sb.removeChannel(channel);
    };
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