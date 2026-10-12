import React, { useState, useEffect } from 'react';
import StoreList, { splitStoreName } from './StoreList.jsx';
import EggPriceChart from './EggPriceChart.jsx';
import { SANS, MONO, SURFACE, HAIRLINE, TEXT, TEXT_2, TEXT_3, TYPE_COLOR, TYPE_LABEL, GOOD, BAD } from '../lib/terminalTheme';

const card = { background: SURFACE, border: `1px solid ${HAIRLINE}`, borderRadius: 16 };

// Cheapest store for one egg type, nearest first on a tie.
function cheapestFor(stores, type) {
  const key = `${type}_price`;
  return stores
    .filter(s => typeof s[key] === 'number')
    .sort((a, b) => a[key] - b[key] || (a.distance ?? Infinity) - (b.distance ?? Infinity))[0] || null;
}

function HeroCard({ type, store, national, onSelect, isMobile }) {
  const price = store?.[`${type}_price`];
  const pct = typeof price === 'number' && typeof national === 'number' && national
    ? ((price - national) / national) * 100
    : null;
  const { brand, branch } = splitStoreName(store?.name);
  return (
    <button
      onClick={() => store && onSelect(store, type)}
      disabled={!store}
      style={{ ...card, textAlign: 'left', padding: isMobile ? 16 : 20, cursor: store ? 'pointer' : 'default', fontFamily: SANS, color: TEXT, minWidth: 0 }}
    >
      <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: TYPE_COLOR[type] }}>
        Cheapest {TYPE_LABEL[type]} · 12 eggs
      </div>
      <div style={{ fontFamily: MONO, fontSize: isMobile ? 34 : 42, fontWeight: 600, letterSpacing: '-0.03em', margin: '8px 0 6px', lineHeight: 1 }}>
        {typeof price === 'number' ? `$${price.toFixed(2)}` : '—'}
      </div>
      {store ? (
        <>
          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{brand}</div>
          <div style={{ fontSize: 12.5, color: TEXT_3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {[branch, typeof store.distance === 'number' ? `${store.distance.toFixed(1)} mi away` : null].filter(Boolean).join(' · ')}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: TEXT_3 }}>No store nearby has a current price.</div>
      )}
      {pct != null && (
        <div style={{ marginTop: 12, fontSize: 12, color: TEXT_2 }}>
          <span style={{ fontFamily: MONO, fontWeight: 600, color: pct < 0 ? GOOD : pct > 0 ? BAD : TEXT_2 }}>
            {Math.abs(pct).toFixed(0)}% {pct < 0 ? 'below' : 'above'}
          </span>{' '}
          national avg <span style={{ fontFamily: MONO }}>${national.toFixed(2)}</span>
        </div>
      )}
    </button>
  );
}

export default function ZipView({
  zipCode,
  stores = [],
  radiusMiles = 3,
  nationalPulse = null,
  isMobile = false,
  selectedStore,
  setSelectedStore,
  hoveredStore,
  setHoveredStore,
  priceType,
  setPriceType,
  onZipSubmit,
}) {
  const [editingZip, setEditingZip] = useState(false);
  const [tempZip, setTempZip] = useState(zipCode || '');
  useEffect(() => { setTempZip(zipCode || ''); }, [zipCode]);

  const submitZip = () => {
    setEditingZip(false);
    if (/^\d{5}$/.test(tempZip) && tempZip !== zipCode) onZipSubmit(tempZip);
    else setTempZip(zipCode || '');
  };

  const pricedCount = stores.filter(s => s.regular_price != null || s.organic_price != null).length;
  const latestDate = stores.reduce((max, s) => {
    const d = s.regular_price_date || s.organic_price_date;
    return d && d > max ? d : max;
  }, '');
  const updated = latestDate
    ? new Date(`${latestDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const selectFromHero = (store, type) => {
    setSelectedStore(store);
    setPriceType(type);
  };

  const { brand, branch } = splitStoreName(selectedStore?.name);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: isMobile ? '16px 12px 40px' : '28px 20px 56px', fontFamily: SANS, color: TEXT }}>
      {/* Title + context line */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 30, fontWeight: 600, letterSpacing: '-0.02em' }}>
          Eggs near{' '}
          {editingZip ? (
            <input
              value={tempZip}
              onChange={e => setTempZip(e.target.value.replace(/\D/g, ''))}
              onBlur={submitZip}
              onKeyDown={e => { if (e.key === 'Enter') submitZip(); if (e.key === 'Escape') { setTempZip(zipCode || ''); setEditingZip(false); } }}
              inputMode="numeric"
              maxLength={5}
              autoFocus
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              aria-label="ZIP code"
              style={{ width: '5.2ch', background: 'transparent', border: 'none', borderBottom: `2px solid ${TYPE_COLOR.regular}`, outline: 'none', color: TEXT, font: 'inherit', fontFamily: MONO, padding: 0 }}
            />
          ) : (
            <button
              onClick={() => setEditingZip(true)}
              title="Change ZIP code"
              style={{ background: 'none', border: 'none', borderBottom: `2px dotted ${TEXT_3}`, padding: 0, color: TEXT, font: 'inherit', fontFamily: MONO, cursor: 'pointer' }}
            >
              {zipCode || '—'}
            </button>
          )}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: TEXT_3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOOD, boxShadow: `0 0 8px ${GOOD}` }} />
          <span>
            <span style={{ fontFamily: MONO, color: TEXT_2 }}>{pricedCount}</span> stores within{' '}
            <span style={{ fontFamily: MONO, color: TEXT_2 }}>{radiusMiles} mi</span>
            {updated && <> · updated <span style={{ fontFamily: MONO, color: TEXT_2 }}>{updated}</span></>}
          </span>
        </div>
      </div>

      {/* Headline: the cheapest dozen of each type nearby */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 10 : 16 }}>
        {['regular', 'organic'].map(t => (
          <HeroCard key={t} type={t} store={cheapestFor(stores, t)} national={nationalPulse?.[t]} onSelect={selectFromHero} isMobile={isMobile} />
        ))}
      </div>

      {/* Store list + selected store's history */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: isMobile ? 10 : 16, alignItems: 'start' }}>
        <section style={{ ...card, padding: isMobile ? 12 : 16 }}>
          <h2 style={{ margin: '0 2px 12px', fontSize: 15, fontWeight: 600 }}>Nearby stores</h2>
          <StoreList
            stores={stores}
            selectedStore={selectedStore}
            setSelectedStore={setSelectedStore}
            hoveredStore={hoveredStore}
            setHoveredStore={setHoveredStore}
            priceType={priceType}
            onPriceTypeChange={setPriceType}
            isMobile={isMobile}
            maxListHeight={isMobile ? 'none' : '560px'}
            maxRows={30}
            zipCode={zipCode}
          />
        </section>

        <section style={{ ...card, padding: isMobile ? 14 : 20, position: isMobile ? 'static' : 'sticky', top: 16 }}>
          {selectedStore ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{brand}</h2>
                <div style={{ fontSize: 12.5, color: TEXT_3, marginTop: 2 }}>
                  {[branch, selectedStore.address, typeof selectedStore.distance === 'number' ? `${selectedStore.distance.toFixed(1)} mi` : null].filter(Boolean).join(' · ')}
                </div>
              </div>
              <EggPriceChart selectedStore={selectedStore} isMobile={isMobile} zipCode={zipCode} priceType={priceType} onPriceTypeChange={setPriceType} />
            </>
          ) : (
            <div style={{ color: TEXT_3, fontSize: 13 }}>Select a store to see its price history.</div>
          )}
        </section>
      </div>
    </div>
  );
}
