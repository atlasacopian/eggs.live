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
      {/* Large logo centered behind the egg */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        className="background-logo"
      >
        <img 
          src="/logo_test2.png" 
          alt="eggs.live" 
          style={{ 
            height: '80vh', 
            maxHeight: '800px',
            objectFit: 'contain',
            opacity: 0.15,
            filter: 'blur(1px)'
          }} 
        />
      </div>
      
      {/* Header (subtitle) above the egg scene */}
      <div
        style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          pointerEvents: 'none',
        }}
        className="header-container"
      >
        <div style={{ fontWeight: 400, letterSpacing: 2, fontFamily: 'Menlo, monospace', fontSize: '12px', opacity: 0.8, textAlign: 'center', marginTop: '20px' }}>
          TRACKING THE EGG-CONOMY
        </div>
      </div>
      {/* 3D Egg scene above the background logo */}
      <div style={{ position: 'relative', zIndex: 20 }}>
        <EggCartonScene />
      </div>
      <LocationPrompt 
        className="location-prompt-container"
        onUseLocation={handleUseLocation} 
        onEnterZip={handleEnterZip} 
      />
    </main>
    </>
  )
} 