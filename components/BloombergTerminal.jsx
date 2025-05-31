import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Tooltip } from 'recharts';
import TerminalTile from './TerminalTile.jsx';
import TerminalHeader from './TerminalHeader.jsx';
import StoreList from './StoreList.jsx';
import EggPriceChart from './EggPriceChart.jsx';
import UsdaPriceChart from './UsdaPriceChart.jsx';
import FredChart from './FredChart.jsx';
import EggNewsPanel from './EggNewsPanel.jsx';

const MOBILE_BREAKPOINT = 768;

// Polygon egg-related tickers (Cal-Maine Foods etc.)
const EGG_STOCK_TICKERS = ['CALM', 'POST', 'HRL', 'VITL'];

// Helper function to format market timestamp
const formatMarketTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  // Always show the exact timestamp when the data was last updated
  // If it's from today, show time
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    }) + ' ET';
  }
  
  // If it's from yesterday, show yesterday + time
  if (diffDays === 1) {
    return 'Yesterday ' + date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    }) + ' ET';
  }
  
  // For recent data (within a week), show day and time
  if (diffDays <= 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago at ` + date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    }) + ' ET';
  }
  
  // For older data, show date and time
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    timeZone: 'America/New_York'
  }) + ' at ' + date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/New_York'
  }) + ' ET';
};

export default function BloombergTerminal({ zipCode, localStores = [], nationalStats = {} }) {
  const [view, setView] = useState('local'); // local | national
  const [selectedStore, setSelectedStore] = useState(localStores[0] || null);
  const [hoveredStore, setHoveredStore] = useState(null);
  const [priceType, setPriceType] = useState('regular');
  const [isMobile, setIsMobile] = useState(false);
  const [eggStocks, setEggStocks] = useState(null);
  const [retailerStocks, setRetailerStocks] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial check
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (localStores.length && selectedStore === null) {
      setSelectedStore(localStores[0]);
    }
  }, [localStores, selectedStore]);

  // Fetch egg stock quotes via our serverless API route (data cached by GitHub-worker)
  useEffect(() => {
    async function fetchEggStocks() {
      try {
        const res = await fetch('/api/egg-stocks');
        const json = await res.json();
        console.log('Egg stock API response', json);
        if (json.data && Array.isArray(json.data)) {
          setEggStocks(json.data);
        } else {
          setEggStocks([]);
        }
      } catch (err) {
        console.error('Client egg stock fetch error', err);
        setEggStocks([]);
      }
    }

    fetchEggStocks();
    const id = setInterval(fetchEggStocks, 60_000);
    return () => clearInterval(id);
  }, []);

  // Retailer stocks
  useEffect(() => {
    async function fetchRetailers() {
      try {
        const res = await fetch('/api/retailer-stocks');
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) setRetailerStocks(json.data); else setRetailerStocks([]);
      } catch (e) { console.error('retailer fetch', e); setRetailerStocks([]); }
    }
    fetchRetailers();
    const id = setInterval(fetchRetailers, 60_000); return () => clearInterval(id);
  }, []);

  // Fake helper data --------------------------------------------------
  const randomSeries = (n = 30, min = 5, max = 10) =>
    Array.from({ length: n }).map((_, i) => ({ idx: i, value: +(Math.random() * (max - min) + min).toFixed(2) }));

  const lineData = randomSeries();
  const barData = localStores.slice(0, 12).map(s => ({ name: s.name?.slice(0, 8) || 'Store', price: s.regular_price || Math.random() * 5 + 5 }));
  const pieData = [
    { name: 'Kroger', value: 30 },
    { name: 'Target', value: 25 },
    { name: 'Walmart', value: 20 },
    { name: 'Other', value: 25 }
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const getGridCols = () => {
    if (isMobile) return 1;
    return view === 'local' ? 5 : 6;
  };

  const getSpan = (desktopSpan) => {
    return isMobile ? 1 : desktopSpan;
  };

  return (
    <div style={{ padding: isMobile ? 8 : 16, background: '#000', color: '#fff', minHeight: '100vh' }}>
      <TerminalHeader 
        zipCode={zipCode} 
        view={view} 
        onSetView={setView} 
        isMobile={isMobile}
      />

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${getGridCols()}, 1fr)`, 
        gap: isMobile ? 8 : 16, 
        marginTop: isMobile ? 8 : 16 
      }}>
        {view === 'local' && (
          <>
            {/* Local View */}
            <TerminalTile title="Store Prices" span={getSpan(3)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
              <StoreList 
                stores={localStores} 
                selectedStore={selectedStore} 
                setSelectedStore={setSelectedStore}
                hoveredStore={hoveredStore}
                setHoveredStore={setHoveredStore}
                priceType={priceType}
                isMobile={isMobile}
              />
            </TerminalTile>
            <TerminalTile title="Store Price History" span={getSpan(2)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
              <EggPriceChart selectedStore={selectedStore} isMobile={isMobile} />
            </TerminalTile>
            <TerminalTile title={`Price Trends for ${zipCode}`} span={getSpan(1)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <Line type="monotone" dataKey="value" stroke="#00c800" dot={false} strokeWidth={2} />
                  <XAxis dataKey="idx" hide />
                  <YAxis hide />
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                </LineChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Volume (Local)" span={getSpan(2)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <Bar dataKey="price" fill="#1e90ff" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                </BarChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Egg-Coin (Local)" span={getSpan(1)} style={{minHeight: isMobile ? '150px' : 'auto'}}>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', color: '#fff', textAlign: 'center', marginTop: isMobile ? 20: 40 }}>
                ${(Math.random() * 10 + 1).toFixed(2)}
              </div>
            </TerminalTile>

            {/* Row 2 (Local) */}
            <TerminalTile title="Market Share (Local)" span={getSpan(2)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={isMobile ? 50 : 70} innerRadius={isMobile ? 25 : 40} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-local-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Heatmap (Local)" span={getSpan(2)} style={{minHeight: isMobile ? '150px' : 'auto'}}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', height: '100%' }}>
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} style={{ background: `hsl(${Math.random() * 120}, 100%, 50%)`, width: '100%', height: '100%' }} />
                ))}
              </div>
            </TerminalTile>
            <TerminalTile title="Ticker (Local)" span={getSpan(2)} style={{minHeight: isMobile ? '80px' : 'auto'}}>
              <marquee style={{ whiteSpace: 'nowrap', fontSize: isMobile ? '0.8rem' : '1rem' }}>
                {['EGG', 'YOLK', 'SCRMBL', 'CALM', 'HEN', 'OVO'].map(sym => (
                  <span key={sym} style={{ marginRight: 28, color: Math.random() > 0.5 ? '#0f0' : '#f00' }}>
                    {sym} {(Math.random() * 100).toFixed(2)} {Math.random() > 0.5 ? '▲' : '▼'} {(Math.random() * 5).toFixed(2)}%
                  </span>
                ))}
              </marquee>
            </TerminalTile>

            {/* Row 3 (Local) */}
            <TerminalTile title="Sentiment (Local)" span={getSpan(1)} style={{minHeight: isMobile ? '100px' : 'auto'}}>
              <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#0f0', textAlign: 'center', marginTop: isMobile ? 25 : 50 }}>
                {(Math.random() * 100).toFixed(0)}%
              </div>
            </TerminalTile>
            <TerminalTile title="Options Vol. (Local)" span={getSpan(1)} style={{minHeight: isMobile ? '100px' : 'auto'}}>
              <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', color: '#0ff', textAlign: 'center', marginTop: isMobile ? 30 : 60 }}>
                {Math.floor(Math.random() * 1000)}
              </div>
            </TerminalTile>
            <TerminalTile title="Futures (Local)" span={getSpan(2)} style={{minHeight: isMobile ? '150px' : 'auto'}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={randomSeries()}>
                  <Line type="monotone" dataKey="value" stroke="#fff" dot={false} strokeWidth={1} />
                  <XAxis dataKey="idx" hide />
                  <YAxis hide />
                </LineChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Commodity News (Local)" span={getSpan(2)} style={{minHeight: isMobile ? '120px' : 'auto'}}>
                <div style={{padding: 8, fontSize: isMobile ? '0.7rem' : '0.8em', color: '#ccc'}}>Feed prices impacting egg costs... USDA report highlights... Avian flu concerns subsiding...</div>
            </TerminalTile>
          </>
        )}

        {view === 'national' && (
          <>
            {/* National View - Row 1 (5 columns total) */}
            <TerminalTile
              title="Historical National Prices"
              span={getSpan(3)}
              style={{ minHeight: isMobile ? '250px' : '300px', maxHeight: isMobile ? '250px' : '300px' }}
            >
              <FredChart symbol="APU0000703111" start="1980-01-01" showTimestamp={true} />
            </TerminalTile>

            <TerminalTile
              title="Current National Prices"
              span={getSpan(3)}
              style={{ minHeight: isMobile ? '250px' : '300px', maxHeight: isMobile ? '250px' : '300px' }}
            >
              <UsdaPriceChart />
            </TerminalTile>

            {/* National View - Row 2: Market indices */}
            {/* Shell Market Index */}
            <TerminalTile title="Egg Stocks" span={getSpan(2)} style={{minHeight: isMobile ? '120px' : 'auto'}}>
              <div style={{ padding: 8, fontFamily: 'Menlo, monospace', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                {eggStocks === null ? (
                  <div style={{ color: '#666' }}>Loading...</div>
                ) : eggStocks.length === 0 ? (
                  <div style={{ color: '#666' }}>No data</div>
                ) : (
                  <>
                    {eggStocks.map((stk) => (
                      <div key={stk.symbol} style={{ color: stk.change_pct >= 0 ? '#0f0' : '#f00' }}>
                        {stk.symbol} {stk.price.toFixed(2)} {stk.change_pct >= 0 ? '▲' : '▼'} {Math.abs(stk.change_pct).toFixed(2)}%
                      </div>
                    ))}
                    <div style={{ color: '#666', fontSize: '0.7em', marginTop: 4, whiteSpace: 'nowrap' }}>
                      Last Update: {(() => {
                        const latest = eggStocks.reduce((a, b) => new Date(a.updated_at) > new Date(b.updated_at) ? a : b);
                        const marketCloseTime = new Date(latest.updated_at);
                        marketCloseTime.setHours(16, 0, 0, 0); // Set to 4:00 PM local time
                        return new Date().getHours() < 9 || new Date().getHours() > 16 ?
                          marketCloseTime.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          }) :
                          new Date(latest.updated_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          });
                      })()}
                    </div>
                  </>
                )}
                <div style={{fontSize:'0.6em',marginTop:2,color:'#666'}}>Source: Polygon.io</div>
              </div>
            </TerminalTile>

            {/* Retailer Stocks */}
            <TerminalTile title="Grocery Store Stocks" span={getSpan(2)} style={{minHeight: isMobile ? '120px' : 'auto'}}>
              <div style={{ padding: 8, fontFamily: 'Menlo, monospace', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                {retailerStocks === null ? (<div style={{color:'#666'}}>Loading...</div>) : retailerStocks.length===0 ? (<div style={{color:'#666'}}>No data</div>) : (<>
                  {retailerStocks.map(rs=> (
                    <div key={rs.symbol} style={{color: rs.change_pct>=0?'#0f0':'#f00'}}>
                      {rs.symbol} {rs.price.toFixed(2)} {rs.change_pct>=0?'▲':'▼'} {Math.abs(rs.change_pct).toFixed(2)}%
                    </div>))}
                  <div style={{color:'#666',fontSize:'0.7em',marginTop:4,whiteSpace:'nowrap'}}>
                    Last Update: {(() => {
                      const latest = retailerStocks.reduce((a, b) => new Date(a.updated_at) > new Date(b.updated_at) ? a : b);
                      const marketCloseTime = new Date(latest.updated_at);
                      marketCloseTime.setHours(16, 0, 0, 0);
                      return new Date().getHours() < 9 || new Date().getHours() > 16
                        ? marketCloseTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
                        : new Date(latest.updated_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
                    })()}
                  </div>
                </>)}
                <div style={{fontSize:'0.6em',color:'#666',marginTop:2}}>Source: Polygon.io</div>
              </div>
            </TerminalTile>

            {/* Egg Price News */}
            <TerminalTile title="News" span={getSpan(2)} style={{ minHeight: isMobile ? '120px' : '150px', maxHeight: isMobile ? '120px' : '150px' }}>
              <div style={{ height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
                <EggNewsPanel fontSize={isMobile ? '0.75rem' : '0.85rem'} />
              </div>
            </TerminalTile>

            {/* National Supply Index */}
            <TerminalTile title="Bird Flu Cases" span={getSpan(3)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{name: 'Supply/Demand', supply: 78, demand: 65}]} layout="vertical" margin={{ top: 20, right: 20, bottom: 0, left: isMobile ? 5 : 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide/>
                  <Tooltip wrapperStyle={{zIndex:1000}} />
                  <Bar dataKey="supply" barSize={isMobile ? 15 : 20} fill="#1e90ff" name="Supply Index" />
                  <Bar dataKey="demand" barSize={isMobile ? 15 : 20} fill="#00c800" name="Demand Index" />
                </BarChart>
              </ResponsiveContainer>
            </TerminalTile>

            {/* National View - Row 4 */}
            <TerminalTile title="Egg Type Distribution (Natl)" span={getSpan(3)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={[{name: 'Cage-Free', value: 45}, {name: 'Conventional', value: 45}, {name: 'Organic', value: 10}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 40 : 60} innerRadius={isMobile ? 20 : 30} labelLine={false} label={({ name, percent }) => isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%` } >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-nat-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </TerminalTile>
            
            {/* National View - Row 5 (More filler to make it distinct) */}
            <TerminalTile title="Global Production Snapshot" span={getSpan(2)} style={{minHeight: isMobile ? '100px' : 'auto'}}>
                 <div style={{padding: 8, textAlign: 'center', fontSize: isMobile ? '0.9em' : '1em', color: '#87CEEB', paddingTop: '15px'}}>
                     <p>Top Producer: China (35 MMT)</p>
                     <p>US Production: ~6.5 MMT (Est.)</p>
                 </div>
            </TerminalTile>
            <TerminalTile title="Export Volume (Dozens)" span={getSpan(2)} style={{minHeight: isMobile ? '100px' : 'auto'}}>
                <div style={{textAlign: 'center', paddingTop: '20px'}}>
                    <p style={{fontSize: isMobile ? '1.1em' : '1.3em', color: '#90EE90'}}>+{(Math.random()*500+100).toFixed(0)}K</p>
                    <p style={{fontSize: isMobile ? '0.6em' : '0.7em', color: '#aaa'}}>vs. Prev. Month</p>
                </div>
            </TerminalTile>
             <TerminalTile title="Weather Outlook (Key Regions)" span={getSpan(2)} style={{minHeight: isMobile ? '120px' : 'auto'}}>
                <div style={{padding: 8, fontSize: isMobile ? '0.7em' : '0.8em', color: '#FFD700'}}>
                    <p><strong>Midwest:</strong> Clear, seasonal temps. Good for transport.</p>
                    <p><strong>Southeast:</strong> Scattered showers, minimal impact.</p>
                </div>
            </TerminalTile>
          </>
        )}
      </div>
    </div>
  );
}