'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import LocationPrompt from '../components/LocationPrompt'
import EggCartonScene from '../components/EggCartonScene'
import TickerStrip from '../components/TickerStrip'

export default function Home() {
  const router = useRouter()

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => router.push('/90026'),
        () => router.push('/90026')
      )
    } else {
      router.push('/90026')
    }
  }

  const handleEnterZip = (zip) => {
    router.push(`/${zip}`)
  }

  return (
    <main className="main" style={{ color: '#000', position: 'relative', background: '#fff', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
        <TickerStrip
          text="NATIONAL AVG: REG $6.23 <span style='color: #00FF00;'>↑</span> | ORG $6.98 <span style='color: #FF0000;'>↓</span>  🥚  123 STORES | 45 ZIP CODES 🥚"
          fontSize="10px"
          overrideBackgroundColor="#fff"
          overrideBorderColor="#000"
        />
      </div>
      {/* 3D Egg scene on top */}
      <EggCartonScene />
      {/* Main header positioned below ticker */}
      <div
        style={{
          position: 'absolute',
          top: '160px', /* Moved down further to clear ticker completely */
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 16px',
          boxSizing: 'border-box'
        }}
        className="header-container"
      >
        <Header />
      </div>
      <LocationPrompt 
        className="location-prompt-container"
        onUseLocation={handleUseLocation} 
        onEnterZip={handleEnterZip} 
      />
      <style jsx>{`
        @media (max-width: 768px) {
          .header-container {
            margin-top: 5vh !important; /* Reduced margin further for mobile */
          }
          /* Target LocationPrompt container via its main wrapper div */
          :global(.location-prompt-container > div) { 
            bottom: 10vh !important; /* Raise prompt slightly on mobile */
          }
        }
      `}</style>
    </main>
  )
} 