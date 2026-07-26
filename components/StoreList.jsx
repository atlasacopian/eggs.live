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

  const oldPriceStyle = { ...priceStyle, color: '#666' };

  const dateLabelStyle = {
    fontSize: '0.6rem',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 1,
  };

  // Scrapers write captured_date/captured_at as UTC calendar dates, so "how
  // many days old" is computed the same way to avoid drifting from what the
  // data actually means by a given day.
  const todayUtc = new Date(new Date().toISOString().slice(0, 10));
  const daysOld = (priceDate) => {
    if (!priceDate) return null;
    const priceDayUtc = new Date(String(priceDate).slice(0, 10));
    return Math.round((todayUtc - priceDayUtc) / 86_400_000);
  };
  const formatShortDate = (priceDate) => {
    const d = new Date(priceDate);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  };

  // Never label a price "today" if it isn't - always show the actual pull
  // date so freshness is explicit rather than assumed. A price 2+ days old
  // (a real gap, not just today's batch not having reached this store yet)
  // is additionally dimmed to flag it as genuinely stale.
  const renderPrice = (price, priceDate) => {
    if (price == null) return <span style={priceStyle}>--</span>;
    const age = daysOld(priceDate);
    return (
      <>
        <span style={age != null && age >= 2 ? oldPriceStyle : priceStyle}>{`$${price.toFixed(2)}`}</span>
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