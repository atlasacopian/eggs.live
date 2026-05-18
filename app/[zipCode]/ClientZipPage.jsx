'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getStoresNearZip } from '../../lib/api';

// Dynamically load the Bloomberg Terminal but with simplified content
const BloombergTerminal = dynamic(
  () => import('../../components/BloombergTerminal.jsx'),
  { ssr: false }
);

export default function ClientZipPage({ zipCode }) {
  const [stores, setStores] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    setLoadingStores(true);
    getStoresNearZip(zipCode)
      .then(data => {
        setStores(data.stores || []);
        setLastUpdated(data.lastUpdated);
      })
      .catch(error => {
        console.error("Failed to fetch stores:", error);
        setStores([]);
      })
      .finally(() => setLoadingStores(false));
  }, [zipCode]);

  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>
      {!loadingStores && (
        <BloombergTerminal 
          zipCode={zipCode} 
          localStores={stores} 
          nationalStats={null}
          showOnlyStoresAndHistory={true}
        />
      )}
      {loadingStores && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>
          Loading data for {zipCode}...
        </div>
      )}
    </main>
  );
} 