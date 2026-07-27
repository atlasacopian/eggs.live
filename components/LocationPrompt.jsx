'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './LocationPrompt.module.css'
import { getCurrentZip } from '../lib/geolocate'

export default function LocationPrompt({ onUseLocation, onEnterZip }) {
  const [zipCode, setZipCode] = useState('')
  const [showZipInput, setShowZipInput] = useState(false)
  const [zipError, setZipError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const router = useRouter()

  const handleLocationClick = async () => {
    if (locating) return
    setLocating(true)
    if (onUseLocation) return onUseLocation()
    const zip = await getCurrentZip()
    router.push(`/${zip || '90026'}`)
  }

  const handleZipSubmit = (e) => {
    e.preventDefault()
    if (submitting) return
    if (/^\d{5}$/.test(zipCode)) {
      setZipError(false)
      setSubmitting(true)
      if (onEnterZip) return onEnterZip(zipCode)
      router.push(`/${zipCode}`)
    } else {
      setZipError(true)
    }
  }

  const zipComplete = showZipInput && /^\d{5}$/.test(zipCode)

  // Mobile's numeric keypad has no Enter/Go key, so there was previously no
  // way to submit at all once the 5th digit was typed - auto-submit instead
  // of waiting on a keypress that may not exist. Still works fine on desktop
  // (form's onSubmit above also fires if someone does press Enter first).
  useEffect(() => {
    if (zipComplete && !submitting) {
      setZipError(false)
      setSubmitting(true)
      if (onEnterZip) onEnterZip(zipCode)
      else router.push(`/${zipCode}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipComplete])

  return (
    <div className={styles.promptWrapper}>
      {/* Buttons Container */}
      <div className={styles.container}>
        <div className={`${styles.option} ${locating ? styles.locating : ''}`} onClick={handleLocationClick}>
          <span className={styles.bracket}>[</span>
          <span className={styles.locationLabel}>&nbsp;{locating ? 'LOCATING…' : 'USE LOCATION'}&nbsp;</span>
          <span className={styles.bracket}>]</span>
        </div>
        <span className={styles.orText}>OR</span>
        <div
          className={`${styles.option} ${styles.zipOption} ${showZipInput ? styles.zipActive : ''} ${zipComplete ? styles.zipComplete : ''}`}
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
                readOnly={submitting}
              />
            </form>
          )}
          <span className={styles.bracket}>]</span>
          {zipComplete && !zipError && (
            <div className={`${styles.pressEnterHint} ${styles.submitting}`}>
              LOADING…
            </div>
          )}
          {showZipInput && zipError && (
            <div className={styles.zipErrorText}>
              Please enter a valid 5-digit ZIP code.
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