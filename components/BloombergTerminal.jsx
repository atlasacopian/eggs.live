import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Tooltip } from 'recharts';
import TerminalTile from './TerminalTile.jsx';
import TerminalHeader from './TerminalHeader.jsx';
import StoreList from './StoreList.jsx';
import EggPriceChart from './EggPriceChart.jsx';

export default function BloombergTerminal({ zipCode, localStores = [], nationalStats = {} }) {
  const [view, setView] = useState('local'); // local | national
  const [selectedStore, setSelectedStore] = useState(localStores[0] || null);
  const [hoveredStore, setHoveredStore] = useState(null);
  const [priceType, setPriceType] = useState('regular');

  useEffect(() => {
    if (localStores.length && selectedStore === null) {
      setSelectedStore(localStores[0]);
    }
  }, [localStores, selectedStore]);

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

  const gridCols = view === 'local' ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)';
  const rowHeight = view === 'local' ? 'auto' : '220px';

  return (
    <div style={{ background: '#000', color: '#fff', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'Menlo, monospace' }}>
      <TerminalHeader view={view} zipCode={zipCode} onSetView={setView} />

      {/* main grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gridAutoRows: rowHeight,
          gap: 6,
          padding: 6,
          height: 'calc(100vh - 34px)',
          overflowY: 'auto',
        }}
      >
        {view === 'local' && (
          <>
            {/* Local Stores & Store History Row */}
            <TerminalTile
              title="Local Stores"
              span={2}
              style={{ overflow: 'auto' }}
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
            <TerminalTile title="Store History" span={4}>
              {selectedStore ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    <button
                      onClick={() => setPriceType('regular')}
                      style={{
                        color: priceType === 'regular' ? '#ffc107' : '#fff',
                        background: 'none',
                        border: 'none',
                        fontWeight: priceType === 'regular' ? 700 : 400,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Regular
                    </button>
                    <button
                      onClick={() => setPriceType('organic')}
                      style={{
                        color: priceType === 'organic' ? '#ffc107' : '#fff',
                        background: 'none',
                        border: 'none',
                        fontWeight: priceType === 'organic' ? 700 : 400,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Organic
                    </button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <EggPriceChart
                      store={(() => {
                        const s = hoveredStore || selectedStore;
                        if (!s) return null;
                        let id = s.store_identifier;
                        if (id && id.startsWith('T')) {
                          // For Target, strip leading 'T'
                          return { ...s, store_identifier: id.slice(1) };
                        }
                        return s;
                      })()}
                      priceType={priceType}
                      highlight={!!hoveredStore}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ padding: 8, color: '#888' }}>Select a store</div>
              )}
            </TerminalTile>

            {/* Row 1 (Local continued) */}
            <TerminalTile title="Price Trend (Local)" span={3}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <Line type="monotone" dataKey="value" stroke="#00ff00" dot={false} strokeWidth={2} />
                  <XAxis dataKey="idx" hide />
                  <YAxis hide />
                </LineChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Volume (Local)" span={2}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <Bar dataKey="price" fill="#1e90ff" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                </BarChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Egg-Coin (Local)" span={1}>
              <div style={{ fontSize: '2rem', color: '#fff', textAlign: 'center', marginTop: 40 }}>
                ${(Math.random() * 10 + 1).toFixed(2)}
              </div>
            </TerminalTile>

            {/* Row 2 (Local) */}
            <TerminalTile title="Market Share (Local)" span={2}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={70} innerRadius={40} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-local-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Heatmap (Local)" span={2}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', height: '100%' }}>
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} style={{ background: `hsl(${Math.random() * 120}, 100%, 50%)`, width: '100%', height: '100%' }} />
                ))}
              </div>
            </TerminalTile>
            <TerminalTile title="Ticker (Local)" span={2}>
              <marquee style={{ whiteSpace: 'nowrap' }}>
                {['EGG', 'YOLK', 'SCRMBL', 'CALM', 'HEN', 'OVO'].map(sym => (
                  <span key={sym} style={{ marginRight: 28, color: Math.random() > 0.5 ? '#0f0' : '#f00' }}>
                    {sym} {(Math.random() * 100).toFixed(2)} {Math.random() > 0.5 ? '▲' : '▼'} {(Math.random() * 5).toFixed(2)}%
                  </span>
                ))}
              </marquee>
            </TerminalTile>

            {/* Row 3 (Local) */}
            <TerminalTile title="Sentiment (Local)" span={1}>
              <div style={{ fontSize: '1.5rem', color: '#0f0', textAlign: 'center', marginTop: 50 }}>
                {(Math.random() * 100).toFixed(0)}%
              </div>
            </TerminalTile>
            <TerminalTile title="Options Vol. (Local)" span={1}>
              <div style={{ fontSize: '1.1rem', color: '#0ff', textAlign: 'center', marginTop: 60 }}>
                {Math.floor(Math.random() * 1000)}
              </div>
            </TerminalTile>
            <TerminalTile title="Futures (Local)" span={2}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={randomSeries()}>
                  <Line type="monotone" dataKey="value" stroke="#fff" dot={false} strokeWidth={1} />
                  <XAxis dataKey="idx" hide />
                  <YAxis hide />
                </LineChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Commodity News (Local)" span={2}>
                <div style={{padding: 8, fontSize: '0.8em', color: '#ccc'}}>Feed prices impacting egg costs... USDA report highlights... Avian flu concerns subsiding...</div>
            </TerminalTile>
          </>
        )}

        {view === 'national' && (
          <>
            {/* National View - Row 1 (5 columns total) */}
            <TerminalTile title="National Price Average" span={2}>
              <div style={{ fontSize: '2.2rem', color: '#00ff00', textAlign: 'center', paddingTop: '15px' }}>
                $ {(nationalStats.avgPrice || 2.85).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#aaa', textAlign: 'center' }}>
                USDA Weekly Avg
              </div>
            </TerminalTile>
            <TerminalTile title="Regional Price Spread" span={3}>
              <div style={{padding: '10px', textAlign: 'center'}}>
                <span style={{margin: '5px 10px', fontSize: '1.1rem'}}>Min: <span style={{color: '#00ff00'}}>${(nationalStats.minPrice || 1.79).toFixed(2)}</span> (SE)</span>
                <span style={{margin: '5px 10px', fontSize: '1.1rem'}}>Max: <span style={{color: '#ff0000'}}>${(nationalStats.maxPrice || 4.20).toFixed(2)}</span> (NW)</span>
                <p style={{fontSize: '0.7em', color: '#888', marginTop: '5px'}}>Source: AMS_2757</p>
              </div>
            </TerminalTile>

            {/* National View - Row 2 */}
            <TerminalTile title="National Supply Index" span={2}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{name: 'Supply/Demand', supply: 78, demand: 65}]} layout="vertical" margin={{ top: 20, right: 20, bottom: 0, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide/>
                  <Tooltip wrapperStyle={{zIndex:1000}} />
                  <Bar dataKey="supply" barSize={20} fill="#1e90ff" name="Supply Index" />
                  <Bar dataKey="demand" barSize={20} fill="#00c800" name="Demand Index" />
                </BarChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="Egg Type Distribution (Natl)" span={3}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={[{name: 'Cage-Free', value: 45}, {name: 'Conventional', value: 45}, {name: 'Organic', value: 10}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` } >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-nat-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </TerminalTile>
            
            {/* National View - Row 3 */}
            <TerminalTile title="Economic Factors" span={3}>
                <ul style={{listStyleType: 'none', padding: '5px 10px', margin: 0, fontSize: '0.85em'}}>
                    <li>CPI (Eggs): <span style={{color: Math.random() > 0.5 ? '#0f0' : '#f00'}}>+1.2% MoM</span></li>
                    <li>Feed Cost Index (Soy): <span style={{color: Math.random() > 0.5 ? '#0f0' : '#f00'}}>-0.5% WoW</span></li>
                    <li>Retailer Sentiment: <span style={{color: '#ffc107'}}>Cautiously Optimistic</span></li>
                     <li>Fuel Price (Diesel Avg): <span style={{color: Math.random() > 0.5 ? '#0f0' : '#f00'}}>$4.05/gal</span></li>
                </ul>
            </TerminalTile>
             <TerminalTile title="USDA Market Highlights" span={2}>
                 <div style={{padding: '8px', fontSize: '0.75em', color: '#ccc', overflowY: 'auto', maxHeight: '130px'}}>
                    <p><strong>MIDWEST:</strong> Prices for Grade A large eggs are mostly steady. Demand is moderate for retail.</p>
                    <p><strong>NORTHEAST:</strong> Offerings are light. Demand is fairly good. Prices firm.</p>
                    <p><strong>HPAI Update:</strong> No new commercial outbreaks reported this week.</p>
                 </div>
            </TerminalTile>

            {/* National View - Row 4 */}
            <TerminalTile title="National Price History (12 Wk)" span={3}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={randomSeries(12, 2.2, 4.0)}>
                  <Line type="monotone" dataKey="value" stroke="#00ff00" dot={{r:2}} strokeWidth={2} />
                  <XAxis dataKey="idx" hide />
                  <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} hide />
                  <Tooltip/>
                </LineChart>
              </ResponsiveContainer>
            </TerminalTile>
            <TerminalTile title="National Egg Ticker" span={2}>
              <marquee style={{ whiteSpace: 'nowrap', paddingTop: '10px' }}>
                {['US_EGG_FUTR', 'CAGED_NATL', 'CAGEFREE_NATL', 'ORG_NATL', 'FEED_COST_IDX'].map(sym => (
                  <span key={sym} style={{ marginRight: 24, color: Math.random() > 0.5 ? '#0f0' : '#f00', fontSize: '0.9em' }}>
                    {sym} {(Math.random() * 150 + 50).toFixed(2)} {Math.random() > 0.5 ? '▲' : '▼'} {(Math.random() * 1.5).toFixed(2)}%
                  </span>
                ))}
              </marquee>
            </TerminalTile>
            
            {/* National View - Row 5 (More filler to make it distinct) */}
            <TerminalTile title="Global Production Snapshot" span={2}>
                 <div style={{padding: 8, textAlign: 'center', fontSize: '1em', color: '#87CEEB', paddingTop: '15px'}}>
                     <p>Top Producer: China (35 MMT)</p>
                     <p>US Production: ~6.5 MMT (Est.)</p>
                 </div>
            </TerminalTile>
            <TerminalTile title="Export Volume (Dozens)" span={1}>
                <div style={{textAlign: 'center', paddingTop: '20px'}}>
                    <p style={{fontSize: '1.3em', color: '#90EE90'}}>+{(Math.random()*500+100).toFixed(0)}K</p>
                    <p style={{fontSize: '0.7em', color: '#aaa'}}>vs. Prev. Month</p>
                </div>
            </TerminalTile>
             <TerminalTile title="Weather Outlook (Key Regions)" span={2}>
                <div style={{padding: 8, fontSize: '0.8em', color: '#FFD700'}}>
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