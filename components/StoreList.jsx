import React, { useState } from 'react'
import { YELLOW, BLUE, PURPLE, PANEL_BG, PANEL_BORDER, ROW_BORDER, changeColor, changeSign } from '../lib/terminalTheme'

// Each column is independently sortable, click-to-toggle ascending/
// descending, like a real data-table header - not a separate "sort by"
// control off to the side.
const COLUMNS = {
  name: { defaultDir: 'asc', compare: (a, b) => a.name.localeCompare(b.name) },
  distance: { defaultDir: 'asc', compare: (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity) },
  city: { defaultDir: 'asc', compare: (a, b) => (a.city || '').localeCompare(b.city || '') },
  regular: { defaultDir: 'asc', compare: (a, b) => (a.regular_price ?? Infinity) - (b.regular_price ?? Infinity) },
  organic: { defaultDir: 'asc', compare: (a, b) => (a.organic_price ?? Infinity) - (b.organic_price ?? Infinity) },
};

const PRICE_COLS_WIDTH = 220;

export default function StoreList({
  stores = [],
  selectedStore = null,
  setSelectedStore = () => {},
  hoveredStore = null,
  setHoveredStore = () => {},
  priceType = 'regular',
  isMobile = false,
  maxListHeight = '400px',
  zipCode = null,
  // A state-wide list has no single origin point to measure distance from -
  // show each store's city instead, and default-sort by price since
  // "nearest" is meaningless without a fixed location.
  showDistance = true,
  initialSortField = 'distance',
  maxRows = 14,
  emptyMessage = null,
}) {
  const [sortField, setSortField] = useState(initialSortField);
  const [sortDir, setSortDir] = useState(COLUMNS[initialSortField].defaultDir);
  const [showUnpriced, setShowUnpriced] = useState(false);

  if (!stores.length) {
    return (
      <div style={{ color: '#888', fontSize: '0.8rem', padding: '6px 8px' }}>
        {emptyMessage || (zipCode ? `No data available for ${zipCode}.` : 'No stores found in this area.')}
      </div>
    )
  }

  const handleSortClick = (field) => {
    if (field === sortField) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(COLUMNS[field].defaultDir);
    }
  };

  const { compare } = COLUMNS[sortField];
  const sortedStores = [...stores].sort((a, b) => {
    const diff = compare(a, b);
    return sortDir === 'asc' ? diff : -diff;
  });

  const storeLineStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
    borderBottom: `1px solid ${ROW_BORDER}`,
    backgroundColor: PANEL_BG,
    boxSizing: 'border-box',
    transition: 'background-color 0.15s',
  };

  // The store name is just an identifier here - the price is what this list
  // is for, so the name stays small and muted instead of competing with it.
  const storeNameStyle = {
    fontWeight: 500,
    fontSize: '0.74rem',
    color: '#ccc',
    lineHeight: 1.15,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const addressStyle = {
    fontSize: '0.6rem',
    color: '#666',
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  // The regular/organic price is the whole point of this list - it should
  // dominate the row visually, bigger and bolder than anything else in it.
  // Its color IS the up/down signal - no separate indicator needed.
  const priceStyle = {
    fontSize: '1.3rem',
    fontWeight: 800,
    letterSpacing: '0.01em',
    lineHeight: 1,
  };

  const changeTextStyle = (change) => ({
    fontSize: '0.64rem',
    fontWeight: 600,
    color: changeColor(change),
    lineHeight: 1,
  });

  const colHeaderStyle = (field, color) => ({
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    color: sortField === field ? color : '#666',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    padding: 0,
  });

  const sortArrow = (field) => (sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '');

  // Price color is the up/down signal itself - green if it rose, red if it
  // fell, plain white if flat/unknown. No separate indicator needed.
  const renderPrice = (price, change) => {
    if (price == null) return <span style={{ ...priceStyle, fontSize: '0.9rem', color: '#3a3a3a' }} title="No recent price">—</span>;
    return <span style={{ ...priceStyle, color: changeColor(change) }}>{`$${price.toFixed(2)}`}</span>;
  };

  // Under the headline (cheapest) price: the average across every dozen the
  // store stocks, then the weekly change - only when the price actually
  // moved, since a column of "0.0%" on every row is just noise. The average
  // is skipped when it equals the cheapest (a store with a single dozen SKU).
  const renderDetails = (price, avg, change) => {
    if (price == null) return null;
    const showAvg = typeof avg === 'number' && avg - price >= 0.005;
    const showChange = typeof change === 'number' && Math.abs(change) >= 0.05;
    if (!showAvg && !showChange) return null;
    return (
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: '0.6rem', lineHeight: 1, whiteSpace: 'nowrap' }}>
        {showAvg && <span style={{ color: '#7a7a7a' }}>avg ${avg.toFixed(2)}</span>}
        {showChange && (
          <span style={changeTextStyle(change)}>
            {changeSign(change)}{Math.abs(change).toFixed(1)}% wk
          </span>
        )}
      </span>
    );
  };

  const hasPrice = (st) => st.regular_price != null || st.organic_price != null;
  const pricedStores = sortedStores.filter(hasPrice);
  const unpricedStores = sortedStores.filter(st => !hasPrice(st));
  const unpricedBrands = [...new Set(unpricedStores.map(st => st.brand))].join(', ');

  const renderRow = (s, dimmed = false) => {
    const isHovered = hoveredStore?.store_identifier === s.store_identifier;
    const isSelected = selectedStore?.store_identifier === s.store_identifier;
    return (
      <div
        key={s.store_identifier}
        onClick={() => setSelectedStore(s)}
        onMouseEnter={() => setHoveredStore(s)}
        style={{
          ...storeLineStyle,
          ...(dimmed ? { padding: '3px 8px', opacity: 0.55 } : null),
          cursor: 'pointer',
          background: isHovered ? '#111' : isSelected ? '#181818' : 'inherit',
          boxShadow: isSelected ? `inset 2px 0 0 ${YELLOW}` : 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={storeNameStyle}>{s.name}</div>
          {!dimmed && <div style={addressStyle}>{s.address}</div>}
        </div>
        <div style={{ width: showDistance ? 56 : 90, flexShrink: 0, textAlign: 'center', fontSize: '0.72rem', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {showDistance
            ? (typeof s.distance === 'number' ? `${s.distance.toFixed(1)}mi` : '--')
            : (s.city || '--')}
        </div>
        <div style={{ display: 'flex', width: PRICE_COLS_WIDTH, flexShrink: 0 }}>
          {['regular', 'organic'].map((t, i) => (
            <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, borderLeft: i ? `1px solid ${ROW_BORDER}` : 'none' }}>
              {renderPrice(s[`${t}_price`], s[`${t}_change`])}
              {renderDetails(s[`${t}_price`], s[`${t}_avg`], s[`${t}_change`])}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        maxHeight: maxListHeight,
      }}
      onMouseLeave={() => setHoveredStore(null)}
    >
      {/* Legend - every number in a row is a 12-count carton price, and
          which of the shelf's cartons each one describes isn't obvious. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', padding: '2px 8px 5px', fontSize: '0.6rem', color: '#777' }}>
        <span><b style={{ color: '#eee' }}>Big price</b> = cheapest 12-egg carton</span>
        <span><span style={{ color: '#aaa' }}>avg</span> = average of every 12-egg carton the store stocks</span>
        <span><span style={{ color: '#aaa' }}>wk</span> = change in cheapest vs. 7 days ago</span>
      </div>
      {/* Sortable column headers, sticky at the top of the scrollable list -
          click any column to sort by it, click again to flip direction. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          background: '#000',
          padding: '1px 8px 4px',
          borderBottom: `1px solid ${PANEL_BORDER}`,
        }}
      >
        <div style={{ flex: 1 }}>
          <button style={{ ...colHeaderStyle('name', YELLOW), justifyContent: 'flex-start' }} onClick={() => handleSortClick('name')}>
            STORE / ADDRESS {sortArrow('name')}
          </button>
        </div>
        <div style={{ width: showDistance ? 56 : 90, flexShrink: 0 }}>
          {showDistance ? (
            <button style={colHeaderStyle('distance', YELLOW)} onClick={() => handleSortClick('distance')}>
              DIST {sortArrow('distance')}
            </button>
          ) : (
            <button style={colHeaderStyle('city', YELLOW)} onClick={() => handleSortClick('city')}>
              CITY {sortArrow('city')}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', width: PRICE_COLS_WIDTH, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <button style={colHeaderStyle('regular', BLUE)} onClick={() => handleSortClick('regular')}>
              REGULAR {sortArrow('regular')}
            </button>
          </div>
          <div style={{ flex: 1, borderLeft: `1px solid ${PANEL_BORDER}` }}>
            <button style={colHeaderStyle('organic', PURPLE)} onClick={() => handleSortClick('organic')}>
              ORGANIC {sortArrow('organic')}
            </button>
          </div>
        </div>
      </div>
      {pricedStores.slice(0, maxRows).map(st => renderRow(st))}
      {/* Stores with no current price (e.g. Target, whose prices are no
          longer collected) stay listed, but folded below the real prices
          instead of interleaving rows of dashes with them. */}
      {unpricedStores.length > 0 && (
        <button
          onClick={() => setShowUnpriced(v => !v)}
          style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${ROW_BORDER}`, color: '#666', fontFamily: 'Menlo, monospace', fontSize: '0.62rem', textAlign: 'left', padding: '6px 8px', cursor: 'pointer' }}
        >
          {showUnpriced ? '▾' : '▸'} {unpricedStores.length} more {unpricedStores.length === 1 ? 'store' : 'stores'} with no current price ({unpricedBrands})
        </button>
      )}
      {showUnpriced && unpricedStores.map(st => renderRow(st, true))}
    </div>
  )
}
