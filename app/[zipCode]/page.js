'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import TickerStrip from '@/components/TickerStrip';
import HistoricalEggPriceCard from '@/components/HistoricalEggPriceCard';

export default function ZipCodePage() {
  const { zipCode } = useParams();

  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: '0 32px' }}>
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
        <TickerStrip text={`NATIONAL AVERAGE HISTORICAL PRICES`} fontSize="10px" />
      </div>
      <div style={{ marginTop: 80, maxWidth: 960, marginInline: 'auto' }}>
        <HistoricalEggPriceCard />
      </div>
    </main>
  );
}