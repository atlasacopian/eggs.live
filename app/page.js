'use client'

import React, { useEffect, useState } from 'react'
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
  const [nationalAvg, setNationalAvg] = useState(null)

  // Ensure dark theme on homepage (matches the terminal results pages)
  useEffect(() => {
    document.documentElement.classList.add('dark-theme')
    document.body.classList.add('dark-theme')
  }, [])

  // Live data teaser: latest national average regular egg price, so the
  // "live" premise is felt on the hero before anyone enters a ZIP.
  useEffect(() => {
    let cancelled = false
    fetch('/api/national-egg-stats')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        const series = data?.priceHistoryRegular
        const latest = series?.[series.length - 1]
        if (latest?.value != null) setNationalAvg(latest.value)
      })
      .catch(() => {})
    return () => { cancelled = true }
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
        color: '#fff',
        position: 'relative',
        background: '#000',
        minHeight: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Soft amber ambient glow behind the egg, echoing the yolk accent color */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 900px)',
          height: 'min(90vw, 900px)',
          background: 'radial-gradient(circle, rgba(255,193,7,0.16) 0%, rgba(255,193,7,0.06) 35%, rgba(255,193,7,0) 70%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
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
            filter: 'invert(1)',
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
        {nationalAvg != null && (
          <div style={{
            fontWeight: 400,
            letterSpacing: 1.5,
            fontFamily: 'Menlo, monospace',
            fontSize: '10px',
            marginTop: '8px',
            textAlign: 'center',
            opacity: 0,
            animation: 'heroFadeIn 0.7s ease-out 0.5s forwards',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>NATIONAL AVG:</span>{' '}
            <span style={{ color: 'var(--accent-color)' }}>${nationalAvg.toFixed(2)}/DOZEN</span>
          </div>
        )}
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
