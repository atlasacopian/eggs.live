'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '../components/Header'
import LocationPrompt from '../components/LocationPrompt'
import { getCurrentZip } from '../lib/geolocate'

const EggCartonScene = dynamic(() => import('../components/EggCartonScene'), {
  ssr: false,
  loading: () => null,
})

export default function Home() {
  const router = useRouter()

  // Ensure light theme on homepage
  useEffect(() => {
    document.documentElement.classList.remove('dark-theme')
    document.body.classList.remove('dark-theme')
  }, [])

  const handleUseLocation = async () => {
    const zip = await getCurrentZip()
    router.push(`/${zip || '90026'}`)
  }

  const handleEnterZip = (zip) => {
    router.push(`/${zip}`)
  }

  return (
    <>
      {/* Preload the 3D model + env map early. next/head doesn't work in the
          App Router; React 19 hoists <link>/<meta>/<title> to <head> even
          rendered here directly, in a client component. */}
      <link rel="preload" href="/final.glb" as="fetch" type="model/gltf-binary" crossOrigin="anonymous" fetchPriority="high" />
      <link rel="preload" href="/studio_small_03_1k.hdr" as="fetch" crossOrigin="anonymous" fetchPriority="high" />
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
      {/* Logo and tagline centered above the egg */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        className="centered-logo-container"
      >
        <img
          src="/logo-test.png"
          alt="eggs.live"
          style={{
            width: 'min(50vw, 380px)',
            height: 'auto',
            objectFit: 'contain',
            marginBottom: '4px',
            opacity: 0,
            animation: 'heroFadeIn 0.7s ease-out 0.1s forwards',
          }}
        />
        <div style={{
          fontWeight: 400,
          letterSpacing: 2,
          fontFamily: 'Menlo, monospace',
          fontSize: '12px',
          opacity: 0,
          textAlign: 'center',
          animation: 'heroFadeIn 0.7s ease-out 0.3s forwards',
        }}>
          TRACKING THE EGG-CONOMY
        </div>
      </div>
      {/* 3D Egg scene behind logo (full-screen) */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30,
          opacity: 0,
          animation: 'heroFadeInScale 0.9s ease-out 0.15s forwards',
        }}
      >
        <EggCartonScene />
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 70,
          opacity: 0,
          /* Opacity-only (no transform) - a transform on this ancestor would
             become the containing block for LocationPrompt's own
             position:fixed root, breaking its viewport-relative positioning */
          animation: 'heroFadeInOpacityOnly 0.7s ease-out 0.7s forwards',
        }}
      >
        <LocationPrompt
          className="location-prompt-container"
          onUseLocation={handleUseLocation}
          onEnterZip={handleEnterZip}
        />
      </div>
    </main>
    <style jsx global>{`
      @keyframes heroFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes heroFadeInOpacityOnly {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes heroFadeInScale {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
    `}</style>
    </>
  )
}
