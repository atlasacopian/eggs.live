'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EggChartScene from '../../components/EggChartScene';
import EggPriceViews from '../../components/EggPriceViews';
import BackButton from '../../components/BackButton';
import { getStoresNearZip } from '../../lib/api';
import TickerStrip from '../../components/TickerStrip';

export default function ZipCodePage() {
  const { zipCode } = useParams();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data for this ZIP (client-side)
    getStoresNearZip(zipCode).then(data => {
      setStores(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [zipCode]);

  if (loading) return null; // Or a loading indicator

  return (
    <main className="main" style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      overflow: 'hidden', 
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '60px'
    }}>
      {/* Ticker - Absolute positioning */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
        <TickerStrip 
          text="NATIONAL AVG: REG $6.23 <span style='color: #00FF00;'>↑</span> | ORG $6.98 <span style='color: #FF0000;'>↓</span>  🥚  123 STORES | 45 ZIP CODES 🥚" 
          fontSize="10px"
        />
      </div>

      {/* Background Scene - Absolute positioning */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <EggChartScene showHistory={true} hoveredStore={null} selectedStore={null} stores={stores} />
      </div>

      {/* Content Wrapper - Adjusted for Flexbox centering */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 960,
        padding: '0 32px',
        boxSizing: 'border-box'
      }}>
        <EggPriceViews zipCode={zipCode} stores={stores} />
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <BackButton />
        </div>
      </div>
    </main>
  );
}