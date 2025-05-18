import React from 'react'

export default function StoreList({ stores = [], onSelect = () => {}, selectedStoreId = null, onHover = () => {}, hoveredStoreId = null }) {
  if (!stores.length) return <div>No stores found in this area</div>

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
            border: '1px solid #444',
            padding: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: onSelect ? 'pointer' : 'default',
            background:
              s.store_identifier === hoveredStoreId
                ? '#333'
                : s.store_identifier === selectedStoreId
                ? '#222'
                : 'inherit',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: '#fff' }}>{s.name}</div>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>{s.address}</div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 120 }}>
            <div style={{ fontSize: '0.65rem', color: '#aaa', display:'flex',justifyContent:'space-between' }}>
              <span>REG</span>
              <span>ORG</span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between', fontWeight:600 }}>
              <span style={{ color:'#fff' }}>{s.regular_price ? `$${s.regular_price.toFixed(2)}` : '--'}</span>
              <span style={{ color:'#fff' }}>{s.organic_price ? `$${s.organic_price.toFixed(2)}` : '--'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 