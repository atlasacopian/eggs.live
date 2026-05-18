'use client';

import React, { useMemo } from 'react';

function buildMapEmbedSrc(store, zipCode) {
  if (!store) return null;
  const lat = store.latitude ?? store.lat;
  const lng = store.longitude ?? store.lng ?? store.lon;
  if (
    lat != null &&
    lng != null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
  ) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=16&output=embed`;
  }
  const line2 = [store.city, store.state, store.zip].filter(Boolean).join(', ');
  const q = [store.name, store.address, line2].filter(Boolean).join(' — ') || `ZIP ${zipCode || ''}`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

/**
 * Google Maps embed centered on the focused store (hover wins over selection).
 * Uses coordinates from API when available; otherwise geocodes via search query.
 */
export default function StoreMapPanel({ focusStore, zipCode }) {
  const src = useMemo(() => buildMapEmbedSrc(focusStore, zipCode), [focusStore, zipCode]);
  const label = focusStore?.name || 'Store';

  if (!src) {
    return (
      <div style={{ padding: 16, color: '#666', fontSize: '0.85rem' }}>
        Select a store to see it on the map.
      </div>
    );
  }

  const frameH = 'clamp(240px, 34vh, 480px)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          height: frameH,
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #222',
        }}
      >
        <iframe
          key={focusStore?.store_identifier || src}
          title={`Map: ${label}`}
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block', width: '100%', height: '100%', minHeight: 220 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div
        style={{
          fontSize: '0.7rem',
          color: '#888',
          marginTop: 6,
          padding: '0 8px 6px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        Showing: {label}
      </div>
    </div>
  );
}
