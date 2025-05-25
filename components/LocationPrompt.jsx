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
          <span className={styles.bracket}>[</span>
          &nbsp;USE&nbsp;LOCATION&nbsp;
          <span className={styles.bracket}>]</span>
        </div>
        <span className={styles.orText}>OR</span>
        <div
          className={`${styles.option} ${showZipInput ? styles.zipActive : ''}`}
          onClick={() => {
            if (!showZipInput) {
              setShowZipInput(true)
              setZipCode('')
            }
          }}
        >
          {!showZipInput ? (
            <>
              <span className={styles.bracket}>[</span>&nbsp;ENTER&nbsp;ZIP&nbsp;CODE&nbsp;<span className={styles.bracket}>]</span>
            </>
          ) : (
            <form className={styles.zipForm} onSubmit={handleZipSubmit}>
              <span className={styles.bracket}>[</span>
              <input
                className={styles.zipInput}
                style={{ width: '5ch', paddingRight: 0 }}
                type="text"
                maxLength={5}
                placeholder="12345"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                autoFocus
              />
              <span className={styles.bracket}>]</span>
            </form>
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