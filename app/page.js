'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import Header from '../components/Header'
import LocationPrompt from '../components/LocationPrompt'
import EggCartonScene from '../components/EggCartonScene'
import EggStockTicker from '../components/EggStockTicker'

export default function Home() {
  const router = useRouter()

  // Ensure light theme on homepage
  useEffect(() => {
    document.documentElement.classList.remove('dark-theme')
    document.body.classList.remove('dark-theme')
  }, [])

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
    <>
      {/* Preload the 3D model early to start fetching before React mounts the scene */}
      <Head>
        <link rel="preload" href="/final.glb" as="fetch" type="model/gltf-binary" crossOrigin="anonymous" />
      </Head>
    <main
      className="main"
      style={{
        color: '#000',
        position: 'relative',
        background: '#fff',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <EggStockTicker />
      </div>
      
      {/* Logo in top left corner */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 60,
          pointerEvents: 'none',
        }}
        className="top-left-logo"
      >
        <img 
          src="/logo_test2.png" 
          alt="eggs.live" 
          style={{ 
            height: '60px',
            objectFit: 'contain'
          }} 
        />
      </div>
      {/* Large logo centered behind the egg */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
        className="background-logo"
      >
        <img 
          src="/logo_test2.png" 
          alt="eggs.live" 
          style={{ 
            height: '60vh', 
            maxHeight: '600px',
            objectFit: 'contain',
            opacity: 1.0
          }} 
        />
      </div>
      
      {/* Subtitle at the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        className="bottom-text-container"
      >
        <div style={{ fontWeight: 400, letterSpacing: 2, fontFamily: 'Menlo, monospace', fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
          TRACKING THE EGG-CONOMY
        </div>
      </div>
      {/* 3D Egg scene above the background logo */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 }}>
        <EggCartonScene />
      </div>
      <div style={{ position: 'relative', zIndex: 70 }}>
        <LocationPrompt 
          className="location-prompt-container"
          onUseLocation={handleUseLocation} 
          onEnterZip={handleEnterZip} 
        />
      </div>
    </main>
    </>
  )
} 