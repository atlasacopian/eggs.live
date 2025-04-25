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
    <main className="main" style={{ color: '#000', position: 'relative', background: '#000', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
        <TickerStrip 
          text="NATIONAL AVG: REG $6.23 <span style='color: #00FF00;'>↑</span> | ORG $6.98 <span style='color: #FF0000;'>↓</span>  🥚  123 STORES | 45 ZIP CODES 🥚" 
          overrideBackgroundColor="white" 
        />
      </div>
      <EggCartonScene />
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          padding: '0 16px',
          boxSizing: 'border-box',
          marginTop: '15vh' /* Space below ticker */,
        }}
      >
        <Header />
      </div>
      <LocationPrompt onUseLocation={handleUseLocation} onEnterZip={handleEnterZip} />
    </main>
  )
} 