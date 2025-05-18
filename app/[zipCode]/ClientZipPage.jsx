'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getStoresNearZip } from '../../lib/api';

// Dynamically load the classic price list view
const BloombergTerminal = dynamic(
  () => import('../../components/BloombergTerminal.jsx'),
  { ssr: false }
);

// Mock national stats for a distinct national view
const mockNationalStats = {
  priceHistoryRegular: Array.from({ length: 30 }).map((_, i) => ({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, value: +(Math.random() * 2 + 2.5).toFixed(2) })),
  priceHistoryOrganic: Array.from({ length: 30 }).map((_, i) => ({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, value: +(Math.random() * 2 + 4.5).toFixed(2) })),
  marketShare: [
    { name: 'Eggs Type A (Nat.)', value: Math.random() * 100 },
    { name: 'Eggs Type B (Nat.)', value: Math.random() * 100 },
    { name: 'Eggs Type C (Nat.)', value: Math.random() * 100 },
  ],
  // Add any other distinct national data points if needed for other tiles
  nationalAverageRegular: 3.15,
  nationalAverageOrganic: 5.25,
};

export default function ClientZipPage({ zipCode }) {
  // Local store data state
  const [stores, setStores] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    setLoadingStores(true); // Set loading true when zipCode changes
    getStoresNearZip(zipCode)
      .then(data => {
        setStores(data.stores || []);
        setLastUpdated(data.lastUpdated);
      })
      .catch(error => {
        console.error("Failed to fetch stores:", error);
        setStores([]); // Clear stores on error
      })
      .finally(() => setLoadingStores(false));
  }, [zipCode]);

  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>
      {/* Pass mockNationalStats to BloombergTerminal */}
      {!loadingStores && (
        <BloombergTerminal zipCode={zipCode} localStores={stores} nationalStats={mockNationalStats} />
      )}
      {loadingStores && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>Loading data for {zipCode}...</div>
      )}
    </main>
  );
} 