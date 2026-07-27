'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StoreList from '../../../components/StoreList.jsx';
import TerminalTile from '../../../components/TerminalTile.jsx';
import { PANEL_BORDER, YELLOW } from '../../../lib/terminalTheme';

export default function ClientStatePage({ stateCode, stateName, initialData }) {
  const router = useRouter();
  const stores = initialData?.stores || [];
  const [selectedStore, setSelectedStore] = useState(null);
  const [hoveredStore, setHoveredStore] = useState(null);
  // Starts null rather than new Date() - the clock's initial value would
  // otherwise be computed once on the server at render time and again on
  // the client at hydration time, a fraction of a second later, tripping a
  // hydration mismatch since the two rendered strings don't match.
  const [currentDateTime, setCurrentDateTime] = useState(null);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    const timeString = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return `${mm}/${dd}/${yyyy} ${timeString}`;
  };

  const regularPrices = stores.map(s => s.regular_price).filter(p => typeof p === 'number');
  const organicPrices = stores.map(s => s.organic_price).filter(p => typeof p === 'number');
  const avgRegular = regularPrices.length ? regularPrices.reduce((a, b) => a + b, 0) / regularPrices.length : null;
  const avgOrganic = organicPrices.length ? organicPrices.reduce((a, b) => a + b, 0) / organicPrices.length : null;
  const lowestRegular = regularPrices.length ? Math.min(...regularPrices) : null;
  const lowestOrganic = organicPrices.length ? Math.min(...organicPrices) : null;

  const labelStyle = { color: '#888', fontSize: '0.62rem', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' };
  const statValueStyle = { fontSize: '1.3rem', fontWeight: 800, lineHeight: 1 };

  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: 6, fontFamily: 'Menlo, monospace' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px 6px',
          borderBottom: `1px solid ${PANEL_BORDER}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>EGGS.LIVE</span>
          <button
            onClick={() => router.push('/90026')}
            style={{ background: 'transparent', border: 'none', color: '#666', fontFamily: 'Menlo, monospace', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer', padding: '3px 0' }}
          >
            ← NATIONAL
          </button>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#999' }}>{currentDateTime ? formatDateTime(currentDateTime) : ''}</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 20,
          padding: '5px 4px',
          marginTop: 5,
          borderBottom: `1px solid ${PANEL_BORDER}`,
        }}
      >
        <div>
          <div style={labelStyle}>{stateName} · Lowest Regular</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
            {lowestRegular != null ? `$${lowestRegular.toFixed(2)}` : '--'}
          </div>
        </div>
        <div>
          <div style={labelStyle}>Lowest Organic</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
            {lowestOrganic != null ? `$${lowestOrganic.toFixed(2)}` : '--'}
          </div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: PANEL_BORDER }} />
        <div>
          <div style={labelStyle}>Avg Regular</div>
          <div style={statValueStyle}>{avgRegular != null ? `$${avgRegular.toFixed(2)}` : '--'}</div>
        </div>
        <div>
          <div style={labelStyle}>Avg Organic</div>
          <div style={statValueStyle}>{avgOrganic != null ? `$${avgOrganic.toFixed(2)}` : '--'}</div>
        </div>
        <div>
          <div style={labelStyle}>Stores</div>
          <div style={statValueStyle}>{stores.length}</div>
        </div>
      </div>

      <div style={{ marginTop: 1 }}>
        <TerminalTile
          title={`All Stores in ${stateName} (${stores.length})`}
          style={{ minHeight: 'calc(100vh - 160px)' }}
        >
          <StoreList
            stores={stores}
            selectedStore={selectedStore}
            setSelectedStore={setSelectedStore}
            hoveredStore={hoveredStore}
            setHoveredStore={setHoveredStore}
            showDistance={false}
            initialSortField="regular"
            maxRows={40}
            maxListHeight="calc(100vh - 200px)"
            emptyMessage={`No store price data available for ${stateName} right now.`}
          />
        </TerminalTile>
      </div>
    </main>
  );
}
