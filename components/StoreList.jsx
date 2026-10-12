import React, { useState } from 'react'
import Segmented from './Segmented.jsx'
import { SANS, MONO, SURFACE_HI, HAIRLINE, TEXT, TEXT_2, TEXT_3, TYPE_COLOR, TYPE_LABEL, GOOD, BAD } from '../lib/terminalTheme'

// "Food 4 Less (Highland Park)" -> { brand: 'Food 4 Less', branch: 'Highland Park' }
export function splitStoreName(name = '') {
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { brand: m[1], branch: m[2] } : { brand: name, branch: '' };
}

const hasPrice = s => s.regular_price != null || s.organic_price != null;

/**
 * Compact store list. Each row: store + where it is on the left, the
 * cheapest regular and organic dozen on the right (average dozen beneath).
 * The selected price type is emphasized and is what "Cheapest" sorts by.
 * Stores with no current price are folded into one row at the bottom.
 */
export default function StoreList({
  stores = [],
  selectedStore = null,
  setSelectedStore = () => {},
  hoveredStore = null,
  setHoveredStore = () => {},
  priceType: priceTypeProp,
  onPriceTypeChange,
  isMobile = false,
  maxListHeight = '400px',
  zipCode = null,
  // A state-wide list has no single origin point to measure distance from -
  // show each store's city instead, and default-sort by price.
  showDistance = true,
  initialSortField = 'distance',
  maxRows = 14,
  emptyMessage = null,
}) {
  const [internalType, setInternalType] = useState(initialSortField === 'organic' ? 'organic' : 'regular');
  const priceType = priceTypeProp ?? internalType;
  const setPriceType = onPriceTypeChange ?? setInternalType;
  const [sort, setSort] = useState(initialSortField === 'distance' ? 'nearest' : 'cheapest');
  const [showUnpriced, setShowUnpriced] = useState(false);
  const PRICE_COL = isMobile ? 70 : 92;

  if (!stores.length) {
    return (
      <div style={{ color: TEXT_3, fontSize: 13, padding: '12px 4px', fontFamily: SANS }}>
        {emptyMessage || (zipCode ? `No stores found near ${zipCode}.` : 'No stores found in this area.')}
      </div>
    )
  }

  const compare = {
    nearest: (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
    cheapest: (a, b) => (a[`${priceType}_price`] ?? Infinity) - (b[`${priceType}_price`] ?? Infinity),
    name: (a, b) => a.name.localeCompare(b.name),
  }[sort];
  const sorted = [...stores].sort(compare);
  const priced = sorted.filter(hasPrice).slice(0, maxRows);
  const unpriced = sorted.filter(s => !hasPrice(s));
  const unpricedBrands = [...new Set(unpriced.map(s => splitStoreName(s.name).brand))].join(', ');

  const sortOptions = showDistance
    ? [{ value: 'nearest', label: 'Nearest' }, { value: 'cheapest', label: 'Cheapest' }]
    : [{ value: 'cheapest', label: 'Cheapest' }, { value: 'name', label: 'A–Z' }];

  const priceCell = (s, t) => {
    const price = s[`${t}_price`];
    const avg = s[`${t}_avg`];
    const change = s[`${t}_change`];
    const emphasized = t === priceType;
    const moved = typeof change === 'number' && Math.abs(change) >= 0.05;
    return (
      <div key={t} style={{ width: PRICE_COL, textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: price == null ? '#3a3a3c' : emphasized ? TEXT : TEXT_2, lineHeight: 1.15 }}>
          {price == null ? '—' : `$${price.toFixed(2)}`}
        </div>
        {price != null && (
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: TEXT_3, marginTop: 2, whiteSpace: 'nowrap' }}>
            {moved && (
              <span style={{ color: change < 0 ? GOOD : BAD, marginRight: 5 }}>
                {change < 0 ? '↓' : '↑'}{Math.abs(change).toFixed(0)}%
              </span>
            )}
            {typeof avg === 'number' && avg - price >= 0.005 ? `avg ${avg.toFixed(2)}` : ''}
          </div>
        )}
      </div>
    );
  };

  const row = (s, dimmed = false) => {
    const { brand, branch } = splitStoreName(s.name);
    const isSelected = selectedStore?.store_identifier === s.store_identifier;
    const isHovered = hoveredStore?.store_identifier === s.store_identifier;
    const place = showDistance ? (typeof s.distance === 'number' ? `${s.distance.toFixed(1)} mi` : null) : s.city;
    // Skip the city when the branch is already named after it ("Turlock · Turlock").
    const where = [branch, place && place.toLowerCase() !== branch.toLowerCase() ? place : null].filter(Boolean).join(' · ');
    return (
      <div
        key={s.store_identifier}
        onClick={() => setSelectedStore(s)}
        onMouseEnter={() => setHoveredStore(s)}
        title={s.address}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: dimmed ? '7px 10px' : '9px 10px',
          borderRadius: 10,
          cursor: 'pointer',
          background: isSelected ? SURFACE_HI : isHovered ? '#141416' : 'transparent',
          opacity: dimmed ? 0.5 : 1,
          transition: 'background 0.12s',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{brand}</div>
          <div style={{ fontSize: 12, color: TEXT_3, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{where}</div>
        </div>
        {!dimmed && ['regular', 'organic'].map(t => priceCell(s, t))}
        {dimmed && <div style={{ fontSize: 11, color: TEXT_3, fontFamily: MONO }}>no current price</div>}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: SANS, display: 'flex', flexDirection: 'column', minHeight: 0 }} onMouseLeave={() => setHoveredStore(null)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 2px 10px', flexWrap: 'wrap' }}>
        <Segmented size="sm" ariaLabel="Sort stores" options={sortOptions} value={sort} onChange={setSort} />
        {/* Column headers double as the Regular/Organic switch. */}
        <div style={{ display: 'flex', gap: 8, paddingRight: 10 }}>
          {['regular', 'organic'].map(t => (
            <button
              key={t}
              onClick={() => setPriceType(t)}
              style={{
                width: PRICE_COL,
                textAlign: 'right',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: MONO,
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: t === priceType ? TYPE_COLOR[t] : TEXT_3,
              }}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: maxListHeight, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {priced.map(s => row(s))}
        {unpriced.length > 0 && (
          <button
            onClick={() => setShowUnpriced(v => !v)}
            style={{ background: 'none', border: 'none', borderTop: `1px solid ${HAIRLINE}`, marginTop: 6, padding: '10px 10px 4px', textAlign: 'left', color: TEXT_3, fontSize: 12, fontFamily: SANS, cursor: 'pointer' }}
          >
            {showUnpriced ? 'Hide' : 'Show'} {unpriced.length} {unpriced.length === 1 ? 'store' : 'stores'} without a current price ({unpricedBrands})
          </button>
        )}
        {showUnpriced && unpriced.map(s => row(s, true))}
      </div>

      <div style={{ borderTop: `1px solid ${HAIRLINE}`, marginTop: 8, padding: '10px 4px 0', fontSize: 11.5, color: TEXT_3, lineHeight: 1.5 }}>
        Prices are for a 12-egg carton. The main price is the <span style={{ color: TEXT_2 }}>cheapest carton</span> on the shelf;
        <span style={{ color: TEXT_2 }}> avg</span> is the average of every carton the store stocks; arrows show the change over 7 days.
      </div>
    </div>
  )
}
