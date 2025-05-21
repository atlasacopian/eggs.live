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
        <div style={{ backgroundColor: '#fff', padding: '8px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <marquee scrollamount="6" style={{ fontFamily: 'Menlo, monospace', fontSize: '16px', color: '#000' }}>
            <span style={{ margin: '0 2rem', color: '#0f0' }}>
              EGG 64.69 ▲ 2.43%
            </span>
            <span style={{ margin: '0 2rem', color: '#f00' }}>
              YOLK 73.90 ▼ 1.59%
            </span>
            <span style={{ margin: '0 2rem', color: '#0f0' }}>
              ALB 88.12 ▲ 0.45%
            </span>
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