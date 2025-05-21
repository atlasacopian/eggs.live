'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Head from 'next/head'
import Header from '../components/Header'
import LocationPrompt from '../components/LocationPrompt'
import EggCartonScene from '../components/EggCartonScene'

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
        <div style={{ backgroundColor: '#fff', border: '1px solid #000', height: '32px', display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <marquee scrollamount="6" style={{ width: '100%', fontFamily: 'Menlo, monospace', fontSize: '14px', color: '#000' }}>
            <span style={{ margin: '0 1rem', color: '#000' }}>EGG 64.69 <span style={{ color: '#0f0' }}>▲</span> 2.43%</span>
            <span style={{ margin: '0 1rem', color: '#000' }}>YOLK 73.90 <span style={{ color: '#f00' }}>▼</span> 1.59%</span>
            <span style={{ margin: '0 1rem', color: '#000' }}>ALB 88.12 <span style={{ color: '#0f0' }}>▲</span> 0.45%</span>
            <span style={{ margin: '0 1rem', color: '#000' }}>CARTON 12.50 <span style={{ color: '#0f0' }}>▲</span> 0.30%</span>
            <span style={{ margin: '0 1rem', color: '#000' }}>SCRMBL 32.10 <span style={{ color: '#f00' }}>▼</span> 0.20%</span>
            <span style={{ margin: '0 1rem', color: '#000' }}>FRESH 102.00 <span style={{ color: '#0f0' }}>▲</span> 0.55%</span>
            <span style={{ margin: '0 1rem', color: '#000' }}>GRADE 90.00 <span style={{ color: '#f00' }}>▼</span> 0.10%</span>
            <span style={{ margin: '0 1rem', color: '#000' }}>WHOLE 150.25 <span style={{ color: '#0f0' }}>▲</span> 0.75%</span>
            <span style={{ margin: '0 1rem', color: '#000' }}>POACHED 75.00 <span style={{ color: '#f00' }}>▼</span> 0.40%</span>
          </marquee>
        </div>
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
    </main>
    </>
  )
} 