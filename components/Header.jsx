import React from 'react'

export default function Header() {
  const baseHeaderStyle = { color: '#000', textAlign: 'center' }
  const baseH1Style = { fontWeight: 700, letterSpacing: '-0.05em', fontFamily: 'inherit', fontSize: '2.5rem', lineHeight: 1.2 }
  const baseH3Style = { fontWeight: 400, letterSpacing: 2, fontFamily: 'inherit', fontSize: '1rem', marginTop: '0.75rem', opacity: 0.8 }

  return (
    <header style={baseHeaderStyle}>
      <h1 style={baseH1Style}>eggs.live</h1>
      <h3 style={baseH3Style}>TRACKING THE EGG-CONOMY</h3>
    </header>
  )
} 