import React from 'react'

export default function StoreList({ stores = [], onSelect = () => {}, selectedStoreId = null, onHover = () => {}, hoveredStoreId = null }) {
  if (!stores.length) return <div>No stores found in this area</div>

  const storeLineStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    borderBottom: '1px solid #222',
    minHeight: '40px',
    backgroundColor: '#000',
    transition: 'background-color 0.3s',
  };

  const storeNameStyle = {
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 'calc(100vw - 340px)',
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

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}
      onMouseLeave={() => onHover(null)}
    >
      {stores.map(s => (
        <div
          key={s.store_identifier}
          onClick={() => onSelect(s)}
          onMouseEnter={() => onHover(s)}
          style={{
            ...storeLineStyle,
            cursor: onSelect ? 'pointer' : 'default',
            background:
              s.store_identifier === hoveredStoreId
                ? '#222'
                : s.store_identifier === selectedStoreId
                ? '#333'
                : 'inherit',
          }}
        >
          <div>
            <div style={storeNameStyle}>{s.name}</div>
            <div style={addressStyle}>{s.address}</div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 260 }}>
            <div style={{ fontSize: '0.72rem', color: '#aaa', display:'flex', gap: 0, letterSpacing: 1, marginBottom: 4 }}>
              <span style={{ flex: 1, textAlign: 'center' }}>REG</span>
              <span style={{ flex: 1, textAlign: 'center' }}>ORG</span>
            </div>
            <div style={{ display:'flex' }}>
              {/* Regular Column */}
              <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                <span style={priceStyle}>{s.regular_price ? `$${s.regular_price.toFixed(2)}` : '--'}</span>
                {typeof s.regular_change === 'number' && (
                  <span style={changeStyle(s.regular_change)}>
                    {s.regular_change > 0 ? '▲' : s.regular_change < 0 ? '▼' : '→'}{Math.abs(s.regular_change).toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Organic Column */}
              <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                <span style={priceStyle}>{s.organic_price ? `$${s.organic_price.toFixed(2)}` : '--'}</span>
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