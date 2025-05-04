'use client';

export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Client-only 3D background
const EggChartScene = dynamicImport(
  () => import('../../components/EggChartScene'),
  { ssr: false }
);
// Client-only price views
const EggPriceViewsClassic = dynamicImport(
  () => import('../../components/EggPriceViews'),
  { ssr: false }
);
const EggPriceViewsTerminal = dynamicImport(
  () => import('../../components/EggPriceViewsTerminal'),
  { ssr: false }
);

// Static imports
import BackButton from '../../components/BackButton';
import TickerStrip from '../../components/TickerStrip';
import ErrorBoundary from '../../components/ErrorBoundary';
import { getStoresNearZip } from '../../lib/api';
// Temporarily commented out for build test - Restore this later!
// import BirdFluEvents from '@/components/BirdFluEvents.jsx'; 
const HistoricalEggPriceCard = dynamicImport(
  () => import('../../components/HistoricalEggPriceCard'),
  { ssr: false }
);
const EggStockChart = dynamicImport(
  () => import('../../components/EggStockChart'),
  { ssr: false }
);
const ComparisonStockChart = dynamicImport(
  () => import('../../components/ComparisonStockChart'),
  { ssr: false }
);
const ComparisonTicker = dynamicImport(
  () => import('../../components/ComparisonTicker'),
  { ssr: false }
);
const ComparisonListView = dynamicImport(
  () => import('../../components/ComparisonListView'),
  { ssr: false }
);

// Define comparison tickers to render additional charts
const comparisonTickers = ['CALM', 'VITL', 'POST', 'TSN'];

export default function ZipCodePage() {
  const { zipCode } = useParams();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [avgRegLA, setAvgRegLA] = useState(null);
  const [avgOrgLA, setAvgOrgLA] = useState(null);
  const [avgRegNat, setAvgRegNat] = useState(null);
  const [avgRegNatDate, setAvgRegNatDate] = useState(null);
  const [avgOrgNat, setAvgOrgNat] = useState(null);
  const [avgOrgNatDate, setAvgOrgNatDate] = useState(null);

  useEffect(() => {
    getStoresNearZip(zipCode)
      .then(data => {
        setStores(data.stores);
        setLastUpdated(data.lastUpdated);
        setAvgRegLA(data.avgRegLA);
        setAvgOrgLA(data.avgOrgLA);
        setAvgRegNat(data.avgRegNat);
        setAvgRegNatDate(data.avgRegNatDate);
        setAvgOrgNat(data.avgOrgNat);
        setAvgOrgNatDate(data.avgOrgNatDate);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [zipCode]);

  // Ensure entire page uses black background
  useEffect(() => {
    document.documentElement.classList.add('dark-theme');
    document.body.classList.add('dark-theme');
    return () => {
      document.documentElement.classList.remove('dark-theme');
      document.body.classList.remove('dark-theme');
    };
  }, []);

  if (loading) {
    return <div style={{ background: '#000', width: '100vw', height: '100vh' }} />;
  }

  return (
    <main
      className="main"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#000',
        color: '#fff',
        position: 'relative',
        minHeight: '100vh',
        /* allow vertical scroll */
        boxSizing: 'border-box',
        width: '100vw',
        margin: 0
      }}
    >
      {/* Ticker strip at top of data page */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
        <TickerStrip
          text="NATIONAL AVG: REG $6.23 <span style='color: #00FF00;'>↑</span> | ORG $6.98 <span style='color: #FF0000;'>↓</span>  🥚  123 STORES | 45 ZIP CODES 🥚"
          fontSize="10px"
        />
      </div>

      {/* 3D Background */}
      <div className="background-3d" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <EggChartScene showHistory={true} />
      </div>

      {/* Foreground Data */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 960,
          padding: '0 32px',
          boxSizing: 'border-box'
        }}
      >
        <ErrorBoundary>
          {stores && stores.length > 0 && (
            <EggPriceViewsClassic
              zipCode={zipCode}
              stores={stores}
              lastUpdated={lastUpdated}
              avgRegLA={avgRegLA}
              avgOrgLA={avgOrgLA}
              avgRegNat={avgRegNat}
              avgRegNatDate={avgRegNatDate}
              avgOrgNat={avgOrgNat}
              avgOrgNatDate={avgOrgNatDate}
            />
          )}
        </ErrorBoundary>
        {/* National FRED Data */}
        <div style={{ marginTop: '32px', padding: '0 24px' }}>
          <HistoricalEggPriceCard />
        </div>
        {/* Bird Flu Data */}
        <div style={{ marginTop: '32px', padding: '0 24px', color: '#fff' }}>
          {/* Temporarily commented out for build test */}
          {/* <BirdFluEvents limit={10} /> */}
        </div>
        {/* Stock Comparison Components */}
        <div style={{ marginTop: '32px', padding: '0 24px' }}>
          <ComparisonTicker tickers={comparisonTickers} />
        </div>
        <div style={{ marginTop: '16px', padding: '0 24px' }}>
          <ComparisonListView tickers={comparisonTickers} />
        </div>
        {/* Back Button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <BackButton />
        </div>
        {/* End main content container */}
      </div>
    </main>
  );
}