import React from 'react'

export default function Header() {
  const baseHeaderStyle = { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
  const baseH3Style = { fontWeight: 400, letterSpacing: 2, fontFamily: 'inherit', fontSize: '1.2rem', marginTop: '24px', opacity: 0.8, textAlign: 'center' }

  return (
    <header style={baseHeaderStyle}>
      <img src="/logo-test.png" alt="eggs.live" style={{ height: '256px', objectFit: 'contain' }} />
      <h3 style={baseH3Style}>TRACKING THE EGG-CONOMY</h3>
    </header>
  )
} 