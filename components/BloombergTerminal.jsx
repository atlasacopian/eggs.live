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

  const toggleView = () => setView(v => (v === 'local' ? 'national' : 'local'));

  const gridCols = view === 'local' ? 'repeat(6, 1fr)' : 'repeat(4, 1fr)';
  const rowHeight = view === 'local' ? 'auto' : '220px';

  return (
    <div style={{ background: '#000', color: '#fff', width: '100%', height: '100vh', overflow: 'hidden', fontFamily: 'Menlo, monospace' }}>
      <TerminalHeader view={view} zipCode={zipCode} onToggle={toggleView} />

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
        {/* Local Stores & Store History Row */}
        {view === 'local' && (
          <>
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
          </>
        )}
        {/* Row 1 */}
        <TerminalTile title="Price Trend" span={view === 'local' ? 3 : 4}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <Line type="monotone" dataKey="value" stroke="#00ff00" dot={false} strokeWidth={2} />
              <XAxis dataKey="idx" hide />
              <YAxis hide />
            </LineChart>
          </ResponsiveContainer>
        </TerminalTile>
        {view==='local'? (
        <TerminalTile title="Volume" span={2}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <Bar dataKey="price" fill="#1e90ff" />
              <XAxis dataKey="name" hide />
              <YAxis hide />
            </BarChart>
          </ResponsiveContainer>
        </TerminalTile>
        ) : null}
        <TerminalTile title="Egg-Coin" span={1}>
          <div style={{ fontSize: '2rem', color: '#fff', textAlign: 'center', marginTop: 40 }}>
            ${(Math.random() * 10 + 1).toFixed(2)}
          </div>
        </TerminalTile>

        {/* Row 2 */}
        <TerminalTile title="Market Share" span={2}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={70} innerRadius={40} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </TerminalTile>
        <TerminalTile title="Heatmap" span={view==='local'?2:2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', height: '100%' }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{ background: `hsl(${Math.random() * 120}, 100%, 50%)`, width: '100%', height: '100%' }} />
            ))}
          </div>
        </TerminalTile>
        <TerminalTile title="Ticker" span={2}>
          <marquee style={{ whiteSpace: 'nowrap' }}>
            {['EGG', 'YOLK', 'SCRMBL', 'CALM', 'HEN', 'OVO'].map(sym => (
              <span key={sym} style={{ marginRight: 28, color: Math.random() > 0.5 ? '#0f0' : '#f00' }}>
                {sym} {(Math.random() * 100).toFixed(2)} {Math.random() > 0.5 ? '▲' : '▼'} {(Math.random() * 5).toFixed(2)}%
              </span>
            ))}
          </marquee>
        </TerminalTile>

        {/* Row 3 */}
        <TerminalTile title="Sentiment" span={1}>
          <div style={{ fontSize: '1.5rem', color: '#0f0', textAlign: 'center', marginTop: 50 }}>
            {(Math.random() * 100).toFixed(0)}%
          </div>
        </TerminalTile>
        <TerminalTile title="Options Vol." span={1}>
          <div style={{ fontSize: '1.1rem', color: '#0ff', textAlign: 'center', marginTop: 60 }}>
            {Math.floor(Math.random() * 1000)}
          </div>
        </TerminalTile>
        <TerminalTile title="Futures" span={2}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={randomSeries()}>
              <Line type="monotone" dataKey="value" stroke="#fff" dot={false} strokeWidth={1} />
              <XAxis dataKey="idx" hide />
              <YAxis hide />
            </LineChart>
          </ResponsiveContainer>
        </TerminalTile>
      </div>
    </div>
  );
} 