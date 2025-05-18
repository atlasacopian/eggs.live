'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getStoresNearZip } from '../../lib/api';

// Dynamically load the classic price list view
const BloombergTerminal = dynamic(
  () => import('../../components/BloombergTerminal.jsx'),
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

  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>
      {/* Local store price list: render only once stores have loaded to avoid no-data placeholder during fetch */}
      {!loadingStores && (
        <BloombergTerminal zipCode={zipCode} localStores={stores} />
      )}
    </main>
  );
} 