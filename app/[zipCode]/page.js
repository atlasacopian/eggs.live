'use client';

export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Client-only 3D background
const EggChartScene = dynamicImport(
  () => import('../../components/EggChartScene'),
  { ssr: false }
);

// Client-only price views
const EggPriceViews = dynamicImport(
  () => import('../../components/EggPriceViews'),
  { ssr: false }
);

import BackButton from '../../components/BackButton';
import TickerStrip from '../../components/TickerStrip';
import ErrorBoundary from '../../components/ErrorBoundary';
import { getStoresNearZip } from '../../lib/api';

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
        overflow: 'hidden',
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
          {stores && stores.length > 0 ? (
            <EggPriceViews
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
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>It looks like we don&apos;t have data for {zipCode} yet.</h2>
              <p>
                Want us to consider adding it?{' '}
                <Link href="https://forms.gle/1guuqo2DSEJr4ifq8" className="request-link" target="_blank" rel="noopener noreferrer">
                  Submit a request here.
                </Link>
              </p>
            </div>
          )}
        </ErrorBoundary>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <BackButton />
        </div>
      </div>
      {/* Request link styling */}
      <style jsx>{`
        .request-link {
          color: #ffc107;
          text-decoration: none;
        }
        .request-link:hover {
          text-decoration: underline;
        }
        @media (max-width: 768px) {
          .background-3d {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}