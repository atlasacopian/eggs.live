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
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
        {/* ticker with white background and simple text style */}
        <div style={{ backgroundColor: '#fff', border: 'none', padding: '8px 16px', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'Menlo, monospace', color: '#000' }}>
          <marquee scrollamount="4" style={{ fontSize: '10px' }}>
            NATIONAL AVG: REG DOZEN $6.23 <span style={{ color: '#00FF00' }}>↑</span> | ORG DOZEN $6.98 <span style={{ color: '#FF0000' }}>↓</span> 🥚 123 STORES | 45 ZIP CODES 🥚
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