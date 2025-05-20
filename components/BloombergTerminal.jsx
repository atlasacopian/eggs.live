import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Tooltip } from 'recharts';
import TerminalTile from './TerminalTile.jsx';
import TerminalHeader from './TerminalHeader.jsx';
import StoreList from './StoreList.jsx';
import EggPriceChart from './EggPriceChart.jsx';
import UsdaPriceChart from './UsdaPriceChart.jsx';
import FredChart from './FredChart.jsx';

const MOBILE_BREAKPOINT = 768;

// Polygon egg-related tickers (Cal-Maine Foods etc.)
const EGG_STOCK_TICKERS = ['CALM', 'POST', 'HRL'];

export default function BloombergTerminal({ zipCode, localStores = [], nationalStats = {} }) {
  const [view, setView] = useState('local'); // local | national
  const [selectedStore, setSelectedStore] = useState(localStores[0] || null);
  const [hoveredStore, setHoveredStore] = useState(null);
  const [priceType, setPriceType] = useState('regular');
  const [isMobile, setIsMobile] = useState(false);
  const [eggStocks, setEggStocks] = useState(null);

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

  // Fake helper data --------------------------------------------------
  const randomSeries = (n = 30, min = 5, max = 10) =>
    Array.from({ length: n }).map((_, i) => ({ idx: i, value: +(Math.random() * (max - min) + min).toFixed(2) }));

  const lineData = randomSeries();
  const barData = localStores.slice(0, 12).map(s => ({ name: s.name?.slice(0, 8) || 'Store', price: s.regular_price || Math.random() * 5 + 5 }));
  const pieData = [
    { name: 'Organic', value: Math.random() * 100 },
    { name: 'Cage-Free', value: Math.random() * 100 },
    { name: 'Conventional', value: Math.random() * 100 },
  ];
  const COLORS = ['#00c800', '#fff', '#1e90ff'];

  const getGridCols = () => {
    if (isMobile) return 'repeat(1, 1fr)';
    // Use 6 columns for both views on desktop to keep height consistent
    return 'repeat(6, 1fr)';
  };

  const getSpan = (desktopSpan) => {
    return isMobile ? 1 : desktopSpan;
  };

  return (
    <div style={{ background: '#000', color: '#fff', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'Menlo, monospace' }}>
      <TerminalHeader view={view} zipCode={zipCode} onSetView={setView} isMobile={isMobile} />

      {/* main grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: getGridCols(),
          gridAutoRows: 'auto',
          gap: isMobile ? 4 : 6,
          padding: isMobile ? 4 : 6,
          height: 'calc(100vh - 34px)', // Header height might change for mobile
          overflowY: 'auto',
        }}
      >
        {view === 'local' && (
          <>
            {/* Local Stores & Store History Row */}
            <TerminalTile
              title="Local Stores"
              span={getSpan(2)}
              style={{ overflow: 'auto', minHeight: isMobile ? '200px' : `${Math.min(localStores.length * 50, 600)}px` }}
              bodyStyle={{ overflowY: 'auto' }}
            >
              <StoreList
                stores={localStores}
                onSelect={setSelectedStore}
                selectedStoreId={selectedStore?.store_identifier}
                onHover={setHoveredStore}
                hoveredStoreId={hoveredStore?.store_identifier}
              />
            </TerminalTile>
            <TerminalTile title="Store History" span={getSpan(4)} style={{minHeight: isMobile ? '300px' : 'auto', padding: '10px'}}>
              {selectedStore ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.8rem', color: '#fff', textAlign: 'center', fontStyle: 'normal', paddingBottom: 4 }}>
                    SHOWING HISTORY FOR: <strong style={{ color: '#ffeb3b', fontWeight: 'bold' }}>{selectedStore.name.toUpperCase()}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span
                      onClick={() => setPriceType('regular')}
                      style={{
                        color: priceType === 'regular' ? '#ffeb3b' : '#666',
                        cursor: 'pointer',
                        fontWeight: priceType === 'regular' ? 'bold' : 'normal',
                        textDecoration: priceType === 'regular' ? 'underline' : 'none',
                      }}
                    >
                      REGULAR
                    </span>
                    <span
                      onClick={() => setPriceType('organic')}
                      style={{
                        color: priceType === 'organic' ? '#ffeb3b' : '#666',
                        cursor: 'pointer',
                        fontWeight: priceType === 'organic' ? 'bold' : 'normal',
                        textDecoration: priceType === 'organic' ? 'underline' : 'none',
                      }}
                    >
                      ORGANIC
                    </span>
                  </div>
                  <EggPriceChart
                    store={selectedStore}
                    priceType={priceType}
                    style={{ flex: 1 }}
                  />
                </div>
              ) : (
                <div style={{ color: '#fff', textAlign: 'center', padding: '20px' }}>
                  No store selected
                </div>
              )}
            </TerminalTile>

            {/* Row 1 (Local continued) */}
            <TerminalTile title="Price Trend (Local)" span={getSpan(3)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <Line type="monotone" dataKey="value" stroke="#00ff00" dot={false} strokeWidth={2} />
                  <XAxis dataKey="idx" hide />
                  <YAxis hide />
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
            <TerminalTile title="Retail Egg CPI (FRED)" span={getSpan(3)} style={{minHeight: isMobile ? '250px' : '300px'}}>
              <FredChart symbol="APU0000703111" start="1980-01-01" />
            </TerminalTile>

            <TerminalTile title="USDA National Egg Prices (Weekly)" span={getSpan(3)} style={{minHeight: isMobile ? '250px' : '300px'}}>
              <UsdaPriceChart />
            </TerminalTile>

            {/* National View - Row 2 */}
            <TerminalTile title="National Supply Index" span={getSpan(3)} style={{minHeight: isMobile ? '200px' : 'auto'}}>
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
            
            {/* National View - Row 3 */}
            <TerminalTile title="Economic Factors" span={getSpan(3)} style={{minHeight: isMobile ? '150px' : 'auto'}}>
                <ul style={{listStyleType: 'none', padding: '5px 10px', margin: 0, fontSize: isMobile ? '0.75em' : '0.85em'}}>
                    <li>CPI (Eggs): <span style={{color: Math.random() > 0.5 ? '#0f0' : '#f00'}}>+1.2% MoM</span></li>
                    <li>Feed Cost Index (Soy): <span style={{color: Math.random() > 0.5 ? '#0f0' : '#f00'}}>-0.5% WoW</span></li>
                    <li>Retailer Sentiment: <span style={{color: '#ffc107'}}>Cautiously Optimistic</span></li>
                     <li>Fuel Price (Diesel Avg): <span style={{color: Math.random() > 0.5 ? '#0f0' : '#f00'}}>$4.05/gal</span></li>
                </ul>
            </TerminalTile>
             <TerminalTile title="USDA Market Highlights" span={getSpan(3)} style={{minHeight: isMobile ? '150px' : 'auto'}}>
                 <div style={{padding: '8px', fontSize: isMobile ? '0.7em' : '0.75em', color: '#ccc', overflowY: 'auto', maxHeight: isMobile ? '120px' :'130px'}}>
                    <p><strong>MIDWEST:</strong> Prices for Grade A large eggs are mostly steady. Demand is moderate for retail.</p>
                    <p><strong>NORTHEAST:</strong> Offerings are light. Demand is fairly good. Prices firm.</p>
                    <p><strong>HPAI Update:</strong> No new commercial outbreaks reported this week.</p>
                 </div>
            </TerminalTile>

            {/* National View - Row 4 */}
            <TerminalTile title="National Egg Ticker" span={getSpan(3)} style={{minHeight: isMobile ? '80px' : 'auto'}}>
              <marquee style={{ whiteSpace: 'nowrap', paddingTop: '10px', fontSize: isMobile ? '0.75rem' : '0.9em' }}>
                {['US_EGG_FUTR', 'CAGED_NATL', 'CAGEFREE_NATL', 'ORG_NATL', 'FEED_COST_IDX'].map(sym => (
                  <span key={sym} style={{ marginRight: 24, color: Math.random() > 0.5 ? '#0f0' : '#f00' }}>
                    {sym} {(Math.random() * 150 + 50).toFixed(2)} {Math.random() > 0.5 ? '▲' : '▼'} {(Math.random() * 1.5).toFixed(2)}%
                  </span>
                ))}
              </marquee>
            </TerminalTile>
            
            {/* Egg Stocks from Polygon */}
            <TerminalTile title="Egg Stocks (Live)" span={getSpan(3)} style={{minHeight: isMobile ? '120px' : 'auto'}}>
              <div style={{ padding: 8, fontFamily: 'Menlo, monospace', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                {eggStocks === null ? (
                  <div style={{ color: '#666' }}>Loading...</div>
                ) : eggStocks.length === 0 ? (
                  <div style={{ color: '#666' }}>Market closed / no data</div>
                ) : (
                  eggStocks.map((stk) => (
                    <div key={stk.symbol} style={{ color: stk.changePct >= 0 ? '#0f0' : '#f00' }}>
                      {stk.symbol} {stk.price.toFixed(2)} {stk.changePct >= 0 ? '▲' : '▼'} {Math.abs(stk.changePct).toFixed(2)}%
                    </div>
                  ))
                )}
              </div>
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