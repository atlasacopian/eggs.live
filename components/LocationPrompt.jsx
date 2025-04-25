'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './LocationPrompt.module.css'

export default function LocationPrompt({ onUseLocation, onEnterZip }) {
  const [zipCode, setZipCode] = useState('')
  const [showZipInput, setShowZipInput] = useState(false)
  const router = useRouter()

  const handleLocationClick = () => {
    if (onUseLocation) return onUseLocation()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => router.push('/90026'),
        () => router.push('/90026')
      )
    } else {
      router.push('/90026')
    }
  }

  const handleZipSubmit = (e) => {
    e.preventDefault()
    if (/^\d{5}$/.test(zipCode)) {
      if (onEnterZip) return onEnterZip(zipCode)
      router.push(`/${zipCode}`)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '20vh', left: '50%', transform: 'translateX(-50%)', zIndex: 20, textAlign: 'center' }}>
      {/* Scan Header */}
      <div 
        style={{ color: '#000', fontFamily: 'Roboto Mono, monospace', letterSpacing: '2px', fontSize: '12px', marginBottom: '1rem' }} 
        className="scan-header-text"
      >
        📡 SCAN FOR EGG PRICES
      </div>
      {/* Buttons Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
        <div className={styles.option} onClick={handleLocationClick}>
          [ USE LOCATION ]
        </div>
        <span style={{ color: '#fff', cursor: 'default' }}>OR</span>
        <div
          className={`${styles.option} ${showZipInput ? styles.activeInput : ''}`}
          onClick={() => {
            setShowZipInput(true)
            setZipCode('')
          }}
        >
          {showZipInput ? (
            <form onSubmit={handleZipSubmit} style={{ display: 'inline-block', position: 'relative' }}>
              <input
                className={styles.zipInput}
                type="text"
                maxLength={5}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                autoFocus
              />
              {zipCode.length === 5 && <span className={styles.enterHint}>↵</span>}
            </form>
          ) : (
            '[ ENTER ZIP CODE ]'
          )}
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 768px) {
          .scan-header-text {
            font-size: 8px !important;
            margin-bottom: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  )
} 