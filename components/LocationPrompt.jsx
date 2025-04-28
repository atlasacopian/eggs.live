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
    <div className={styles.promptWrapper}>
      {/* Buttons Container */}
      <div className={styles.container}>
        <div className={styles.option} onClick={handleLocationClick}>
          [ USE LOCATION ]
        </div>
        <span className={styles.orText}>OR</span>
        <div
          className={`${styles.option} ${showZipInput ? styles.activeInput : ''}`}
          onClick={() => { if (!showZipInput) { setShowZipInput(true); setZipCode(''); } }}
        >
          {!showZipInput ? (
            '[ ENTER ZIP CODE ]'
          ) : (
            <div className={styles.zipForm}>
              <span className={styles.bracket}>[</span>
              <input
                className={styles.zipInput}
                type="text"
                maxLength={5}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className={styles.enterHint}
                onClick={(e) => { e.preventDefault(); handleZipSubmit(e); }}
              >↵</button>
              <span className={styles.bracket}>]</span>
            </div>
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