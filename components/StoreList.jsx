import React from 'react'

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
}) {
  if (!stores.length) {
    return (
      <div style={{ color: '#888', fontSize: '0.85rem', padding: '8px 10px' }}>
        {zipCode ? `No data available for ${zipCode}.` : 'No stores found in this area.'}
      </div>
    )
  }

  const storeLineStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 10px',
    borderBottom: '1px solid #222',
    backgroundColor: '#000',
    transition: 'background-color 0.3s',
  };

  const storeNameStyle = {
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  };

  const addressStyle = {
    fontSize: '0.7rem',
    color: '#777',
  };

  const priceStyle = {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1,
  };

  const changeStyle = (change) => ({
    fontSize: '0.65rem',
    fontWeight: 600,
    color: change > 0 ? '#00FF00' : change < 0 ? '#FF0000' : '#888',
    lineHeight: 1,
    marginTop: 2,
  });

  const staleStyle = {
    fontSize: '0.85rem',
    fontWeight: 600,
    fontStyle: 'italic',
    color: '#666',
    lineHeight: 1,
  };

  const dateLabelStyle = {
    fontSize: '0.6rem',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 1,
  };

  // Freshness is judged in the viewer's own local time, not the server's or
  // the scraper's timezone - a price from "yesterday" should mean yesterday
  // wherever the person looking at this page happens to be.
  // new Date("YYYY-MM-DD") parses as UTC midnight (a JS quirk for date-only
  // strings), so build a local-midnight Date manually instead.
  const parseDateOnlyLocal = (dateStr) => {
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const now = new Date();
  const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysOld = (priceDate) => {
    if (!priceDate) return null;
    return Math.round((todayLocalMidnight - parseDateOnlyLocal(priceDate)) / 86_400_000);
  };
  const formatShortDate = (priceDate) => {
    const d = parseDateOnlyLocal(priceDate);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // Never label a price "today" if it isn't - always show the actual pull
  // date so freshness is explicit rather than assumed. A price 2+ days old
  // is a real data gap (not just today's batch not having reached this
  // store yet), so the number itself is replaced with "STALE" rather than
  // shown as if it were still a usable current price.
  const renderPrice = (price, priceDate) => {
    if (price == null) return <span style={priceStyle}>--</span>;
    const age = daysOld(priceDate);
    if (age != null && age >= 2) {
      return (
        <>
          <span style={staleStyle}>STALE</span>
          <span style={dateLabelStyle}>{formatShortDate(priceDate)}</span>
        </>
      );
    }
    return (
      <>
        <span style={priceStyle}>{`$${price.toFixed(2)}`}</span>
        <span style={dateLabelStyle}>{formatShortDate(priceDate)}</span>
      </>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflowY: 'auto',
        maxHeight: maxListHeight,
      }}
      onMouseLeave={() => setHoveredStore(null)}
    >
      {stores.slice(0, 10).map(s => (
        <div
          key={s.store_identifier}
          onClick={() => setSelectedStore(s)}
          onMouseEnter={() => setHoveredStore(s)}
          style={{
            ...storeLineStyle,
            cursor: 'pointer',
            background:
              hoveredStore?.store_identifier === s.store_identifier
                ? '#222'
                : selectedStore?.store_identifier === s.store_identifier
                ? '#333'
                : 'inherit',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={storeNameStyle}>{s.name}</div>
            <div style={addressStyle}>{s.address}</div>
            {typeof s.distance === 'number' && (
              <div style={{ ...addressStyle, fontStyle: 'italic' }}>
                {s.distance.toFixed(1)} mi away
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', minWidth: 260, flexShrink: 0 }}>
            <div style={{ fontSize: '0.72rem', color: '#aaa', display:'flex', gap: 0, letterSpacing: 1, marginBottom: 4 }}>
              <span style={{ flex: 1, textAlign: 'center' }}>LOWEST REGULAR</span>
              <span style={{ flex: 1, textAlign: 'center' }}>LOWEST ORGANIC</span>
            </div>
            <div style={{ display:'flex' }}>
              {/* Regular Column */}
              <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                {renderPrice(s.regular_price, s.regular_price_date)}
                {typeof s.regular_change === 'number' && (
                  <span style={changeStyle(s.regular_change)}>
                    {s.regular_change > 0 ? '▲' : s.regular_change < 0 ? '▼' : '→'}{Math.abs(s.regular_change).toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Organic Column */}
              <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                {renderPrice(s.organic_price, s.organic_price_date)}
                {typeof s.organic_change === 'number' && (
                  <span style={changeStyle(s.organic_change)}>
                    {s.organic_change > 0 ? '▲' : s.organic_change < 0 ? '▼' : '→'}{Math.abs(s.organic_change).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 