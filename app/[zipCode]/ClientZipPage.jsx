'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically load the Bloomberg Terminal but with simplified content
const BloombergTerminal = dynamic(
  () => import('../../components/BloombergTerminal.jsx'),
  { ssr: false }
);

export default function ClientZipPage({ zipCode, initialData }) {
  const stores = initialData?.stores || [];

  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>
      <BloombergTerminal
        zipCode={zipCode}
        localStores={stores}
        radiusMiles={initialData?.radiusMiles}
        nationalStats={null}
        showOnlyStoresAndHistory={true}
      />
    </main>
  );
}