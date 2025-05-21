import React from 'react'

export default function Header() {
  const baseHeaderStyle = { textAlign: 'center' }
  const baseH3Style = { fontWeight: 400, letterSpacing: 2, fontFamily: 'inherit', fontSize: '1rem', marginTop: '0.5rem', opacity: 0.8 }

  return (
    <header style={baseHeaderStyle}>
      <img src="/logo test.png" alt="eggs.live" style={{ height: '192px', objectFit: 'contain' }} />
      <h3 style={baseH3Style}>TRACKING THE EGG-CONOMY</h3>
    </header>
  )
} 