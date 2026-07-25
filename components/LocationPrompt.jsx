'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './LocationPrompt.module.css'

export default function LocationPrompt({ onUseLocation, onEnterZip }) {
  const [zipCode, setZipCode] = useState('')
  const [showZipInput, setShowZipInput] = useState(false)
  const [zipError, setZipError] = useState(false)
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
      setZipError(false)
      if (onEnterZip) return onEnterZip(zipCode)
      router.push(`/${zipCode}`)
    } else {
      setZipError(true)
    }
  }

  return (
    <div className={styles.promptWrapper}>
      {/* Buttons Container */}
      <div className={styles.container}>
        <div className={styles.option} onClick={handleLocationClick}>
          <span className={styles.bracket}>[</span>
          &nbsp;USE&nbsp;LOCATION&nbsp;
          <span className={styles.bracket}>]</span>
        </div>
        <span className={styles.orText}>OR</span>
        <div
          className={`${styles.option} ${styles.zipOption} ${showZipInput ? styles.zipActive : ''}`}
          onClick={() => {
            if (!showZipInput) {
              setShowZipInput(true)
              setZipCode('')
            }
          }}
        >
          <span className={styles.bracket}>[</span>
          {!showZipInput ? (
            <span className={styles.zipLabel}>&nbsp;ENTER&nbsp;ZIP&nbsp;CODE&nbsp;</span>
          ) : (
            <form className={styles.zipForm} onSubmit={handleZipSubmit}>
              <input
                className={styles.zipInput}
                style={{ width: '80px' }}
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="12345"
                value={zipCode}
                onChange={(e) => { setZipCode(e.target.value); setZipError(false) }}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                autoFocus
              />
            </form>
          )}
          <span className={styles.bracket}>]</span>
          {showZipInput && /^\d{5}$/.test(zipCode) && (
            <button
              type="button"
              className={styles.enterHint}
              onClick={handleZipSubmit}
              aria-label="Submit ZIP code"
            >
              ↵ ENTER
            </button>
          )}
        </div>
      </div>
      {showZipInput && zipError && (
        <div className={styles.zipErrorText}>
          Please enter a valid 5-digit ZIP code.
        </div>
      )}
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