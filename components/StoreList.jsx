import React from 'react'

export default function StoreList({ stores = [] }) {
  if (!stores.length) return <div>No stores found in this area</div>

  return (
    <div className="stores-container">
      {stores.map(s => (
        <div key={s.id} className="store-card">
          <h4>{s.name}</h4>
          <p>{s.address}</p>
          <div style={{ marginTop: 10 }}>
            <div>REG: ${s.regular_price?.toFixed(2) ?? 'N/A'}</div>
            <div>ORG: ${s.organic_price?.toFixed(2) ?? 'N/A'}</div>
          </div>
        </div>
      ))}
    </div>
  )
} 