'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import TickerStrip from '../../components/TickerStrip.jsx';
import { getStoresNearZip } from '../../lib/api';

// Dynamically load the chart without SSR in a client component
const ZipFREDChart = dynamic(
  () => import('../../components/ZipFREDChart.jsx'),
  { ssr: false }
);

// Dynamically load the classic price list view
const EggPriceViewsClassic = dynamic(
  () => import('../../components/EggPriceViews'),
  { ssr: false }
);

export default function ClientZipPage({ zipCode }) {
  // Local store data state
  const [stores, setStores] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    getStoresNearZip(zipCode)
      .then(data => {
        setStores(data.stores || []);
        setLastUpdated(data.lastUpdated);
      })
      .finally(() => setLoadingStores(false));
  }, [zipCode]);

  if (loadingStores) {
    return <div style={{ color: '#fff', padding: 32 }}>Loading store data…</div>;
  }

  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: 24 }}>
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
        <TickerStrip
          text="NATIONAL AVG: REG DOZEN $6.23 <span style='color: #00FF00;'>↑</span> | ORG DOZEN $6.98 <span style='color: #FF0000;'>↓</span>  🥚  123 STORES | 45 ZIP CODES 🥚"
          fontSize="10px"
          overrideBackgroundColor="#000"
        />
      </div>
      {/* Local store price list */}
      <div style={{ marginTop: 80, maxWidth: 960, marginInline: 'auto' }}>
        <EggPriceViewsClassic
          zipCode={zipCode}
          stores={stores}
          lastUpdated={lastUpdated}
        />
      </div>
      {/* Historical FRED chart below */}
      <div style={{ marginTop: '32px', padding: '0 24px' }}>
        <ZipFREDChart />
      </div>
    </main>
  );
} 