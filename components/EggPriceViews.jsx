'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EggPriceChart from './EggPriceChart'
import { motion } from 'framer-motion'

// Sample nearby store data – replace later with DB/API
const nearbyStores = [
  { store: 'SMART & FINAL', address: '1410 E 1ST ST', distance: 2.3, regular: 5.29, regularChange: -0.9, organic: 7.59, organicChange: -1.1 },
  { store: "TRADER JOE'S", address: '1600 VINE ST', distance: 3.1, regular: 5.49, regularChange: -0.6, organic: 7.89, organicChange: -0.9 },
  { store: 'WHOLE FOODS', address: '788 MISSION ST', distance: 0.8, regular: 6.59, regularChange: -0.3, organic: 8.89, organicChange: 0.7 },
  { store: 'VONS', address: '1342 N ALVARADO ST', distance: 2.5, regular: 6.89, regularChange: 0.8, organic: 8.29, organicChange: 1.0 },
  { store: "GELSON'S", address: '2725 YOSEMITE DR', distance: 3.4, regular: 7.19, regularChange: 0.4, organic: 9.29, organicChange: 0.6 },
  { store: 'RALPHS', address: '2600 VERMONT AVE', distance: 1.2, regular: 7.79, regularChange: -1.4, organic: 9.49, organicChange: 2.1 },
]

export default function EggPriceViews({ zipCode: initialZipCode = '90026', stores = [], onHoverStore, onSelectStore }) {
  const accentColor = '#ffc107' // Yolk yellow
  const [sortBy, setSortBy] = useState('distance') // Default sort by distance
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentZip, setCurrentZip] = useState(initialZipCode)
  const [isEditingZip, setIsEditingZip] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [locationInfo, setLocationInfo] = useState({ city: null, state: null, loading: true });

  useEffect(() => {
    setCurrentZip(initialZipCode);
  }, [initialZipCode]);

  // Fetch City/State when ZIP changes
  useEffect(() => {
    if (currentZip && currentZip.length === 5 && !isEditingZip) {
      setLocationInfo(prev => ({ ...prev, loading: true }));
      fetch(`https://api.zippopotam.us/us/${currentZip}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch location');
          return res.json();
        })
        .then(data => {
          const place = data?.places?.[0];
          setLocationInfo({
            city: place?.['place name'] || null,
            state: place?.state || null,
            loading: false
          });
        })
        .catch(err => {
          console.warn(`Error fetching location for zip ${currentZip}:`, err);
          setLocationInfo({ city: null, state: null, loading: false }); // Reset on error
        });
    } else {
        // Reset if zip is invalid or being edited
        setLocationInfo({ city: null, state: null, loading: false });
    }
  }, [currentZip, isEditingZip]); // Re-run when zip changes or editing stops

  const router = useRouter()

  const now = new Date().toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    weekday: 'short', month: 'short', day: 'numeric'
  })

  /* ---------- Helpers ---------- */
  const formatPrice = num => num?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  // Revert formatChange to not handle className
  const formatChange = (value) => {
    if (value == null || value === 0) return <span style={{ marginLeft: 4, color: '#888', fontWeight: 600 }}>→0.0%</span> // Handle zero change
    const isNegative = value < 0;
    // Colors: Green for positive (up), Red for negative (down)
    const color = isNegative ? '#FF0000' : '#00FF00'; // Red for negative, Green for positive
    const arrow = isNegative ? '↓' : '↑' // Corrected arrows
    return (
      <span style={{ display: 'block', marginTop: 4, marginLeft: 0, color, fontWeight: 600, fontSize: '0.75rem' }}>
        {arrow}{Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  // Helper to clean address and create Google Maps link
  const formatAddress = (address) => {
    if (!address) return { display: 'N/A', link: '#' };
    // Remove common city/state/zip/country patterns (adjust if needed)
    const displayAddress = address.replace(/, Los Angeles, CA \d{5}, United States$|, CA \d{5}$|, United States$/i, '').trim();
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    return { display: displayAddress, link: mapsLink };
  };

  // Choose incoming data if provided; otherwise fallback to demo array
  const dataset = stores.length
    ? stores.map(s => ({
        // Ensure consistent naming and handle potential nulls
        store: s.name ?? s.store ?? 'Unknown Store',
        address: s.address ?? 'No Address',
        distance: typeof s.distance === 'number' ? s.distance : null, // Ensure distance is number or null
        regular: typeof s.regular_price === 'number' ? s.regular_price : null,
        regularChange: typeof s.regular_change === 'number' ? s.regular_change : null, 
        organic: typeof s.organic_price === 'number' ? s.organic_price : null,
        organicChange: typeof s.organic_change === 'number' ? s.organic_change : null,
        store_identifier: s.store_identifier
      }))
    : nearbyStores

  // Filter out stores completely missing price data
  const availableStores = dataset.filter(s => 
      s.regular != null || s.organic != null
  );

  /* ---------- Sorting ---------- */
  const toggleSort = key => {
    if (sortBy === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDirection('asc') // Directly set to ascending for new column
    }
  }

  const sortedStores = [...availableStores].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];

    // Handle string sorting for store name
    if (sortBy === 'store') {
      const compare = (valA ?? '').localeCompare(valB ?? '');
      return sortDirection === 'asc' ? compare : -compare;
    }

    // Handle numeric sorting, treating nulls as highest value
    const numA = valA == null ? Infinity : valA;
    const numB = valB == null ? Infinity : valB;
    const diff = numA - numB;
    
    return sortDirection === 'asc' ? diff : -diff;
  })

  // Calculate cheapest based on the *original* filtered data, not the sorted one
  const getCheapestFromDataset = (key) => {
    if (!availableStores.length) return { price: null, change: null, store: null, address: null };
    // Sort a *copy* just for finding the minimum, ignoring current table sort state
    const cheapest = [...availableStores].sort((a, b) => {
      if (a[key] == null && b[key] == null) return 0;
      if (a[key] == null) return 1; 
      if (b[key] == null) return -1;
      return a[key] - b[key];
    })[0];
    return {
      price:   cheapest?.[key],
      change:  cheapest?.[`${key}Change`],
      store:   cheapest?.store,
      address: cheapest?.address
    };
  };

  // Use the independent cheapest calculation
  const cheapestReg = getCheapestFromDataset('regular')
  const cheapestOrg = getCheapestFromDataset('organic')

  // Compute average regular and organic prices for stores within 3 miles
  const localStores = availableStores.filter(s => typeof s.distance === 'number' && s.distance <= 3)
  const regList = localStores.map(s => s.regular).filter(v => v != null)
  const orgList = localStores.map(s => s.organic).filter(v => v != null)
  const avgReg = regList.length ? regList.reduce((a, b) => a + b, 0) / regList.length : null
  const avgOrg = orgList.length ? orgList.reduce((a, b) => a + b, 0) / orgList.length : null

  /* ---------- ZIP Editing Handlers ---------- */
  const handleZipClick = () => {
    setIsEditingZip(true);
  };

  const handleZipChange = (e) => {
    // Allow only digits, max 5
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 5) {
      setCurrentZip(value);
    }
  };

  const handleZipSubmit = (e) => {
    e.preventDefault();
    if (currentZip && currentZip.length === 5) {
      setIsEditingZip(false);
      router.push(`/${currentZip}`); // Navigate to new ZIP page
    } else {
      // Optionally, show an error or revert
      setIsEditingZip(false);
      setCurrentZip(initialZipCode); // Revert if invalid
    }
  };

  const handleZipBlur = () => {
      // If user clicks away, submit if valid, otherwise revert
      if (currentZip && currentZip.length === 5) {
          setIsEditingZip(false);
          router.push(`/${currentZip}`);
      } else {
          setIsEditingZip(false);
          setCurrentZip(initialZipCode); // Revert on blur if invalid
      }
  };

  /* ---------- Render ---------- */
  return (
    <div style={{ 
      maxWidth: 960, 
      width: '100%', 
      margin: '0 auto', 
      fontFamily: 'Roboto Mono, monospace', 
      color: '#fff', 
      padding:'24px', 
      background: '#000', 
      borderRadius: '12px' // Larger rounding for main console
    }}>
      {/* Combined editable feed header */}
      <h2 style={{ 
        textAlign: 'center', 
        letterSpacing: 2, 
        marginBottom: 16, // Reduced bottom margin 
        color: 'inherit', 
        fontSize: '7px' // Reduced from 10px
      }}>
        {isEditingZip ? (
          <form onSubmit={handleZipSubmit} style={{ display: 'inline-block' }}>
            <input
              className="zip-input"
              type="text"
              value={currentZip}
              onChange={handleZipChange}
              onBlur={handleZipBlur}
              maxLength={5}
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #ccc',
                fontFamily: 'inherit',
                fontSize: '25px', // Match static display size
                fontWeight: 'inherit',
                letterSpacing: 'inherit',
                color: 'inherit',
                textAlign: 'center',
                width: '6ch', // Fit exactly 5-digit zip
                outline: 'none',
                caretColor: accentColor
              }}
            />
          </form>
        ) : (
          <>
            {/* Location Text (City, State) - Placed ABOVE ZIP */}
            <div style={{ 
                fontSize: '7px', // Reduced from 10px
                letterSpacing: 2, 
                color: locationInfo.city ? '#fff' : '#666', // Dim if loading/error
                marginBottom: '4px' 
              }}> 
              {locationInfo.loading ? 'Loading location...' : 
               locationInfo.city ? `EGG PRICES IN ${locationInfo.city.toUpperCase()}, ${locationInfo.state?.toUpperCase()}` : 
               'EGG PRICES'}
            </div>

            {/* Make ZIP code large and clickable */}
            <div 
              onClick={handleZipClick}
              title="Click to change ZIP code"
              style={{ 
                fontSize: '25px', 
                fontWeight: '700', 
                lineHeight: '1',
                display: 'inline-block',
                marginBottom: '8px',
                cursor: 'pointer', // Make cursor a pointer
                padding: '0 8px', // Add padding for better hover effect
                borderRadius: '4px', // Add rounding
                transition: 'background-color 0.2s ease' // Smooth transition
              }}
              className="zip-display"
            >
              {currentZip}  <span style={{ marginLeft: '4px', fontSize: '0.6em', opacity: 0.7 }}>🖉</span>
            </div>

            {/* Last Updated Text - Placed BELOW ZIP */}
            <p
              style={{ 
                textAlign: 'center', 
                fontSize: 6, // Reduced from 8px
                marginTop: 0, // Remove top margin
                marginBottom: '8px', // Add space below
                letterSpacing:1, 
                color:accentColor 
              }}
            >
              LAST UPDATED: {now.toUpperCase()}
            </p>
          </>
        )}
      </h2>

      {/* Styles for hint text visibility on hover */}
      <style jsx>{`
        .store-item {
          background: #111; /* Darker background for rows */
          border: 1px solid #282828; /* Subtle dark border */
          border-radius: 8px !important; /* Force rounding */
          overflow: hidden; /* Ensure content doesn't break rounding */
          transition: box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease, transform 0.2s ease; /* Faster transition, add transform */
          margin-bottom: 16px; /* Slightly reduced margin */
        }
        .store-item .hint {
          opacity: 0;
          transition: opacity 0.2s ease-out;
          color: ${accentColor};
          font-size: 0.8rem; /* Keep hint small */
          margin-top: 8px;
        }
        .store-item:hover .hint {
          opacity: 1;
        }
        .store-item:hover {
          /* Highlight border on hover */
          border-color: ${accentColor}aa; /* Slightly softer neon border */
          background: #1a1a1a; /* Slightly lighter hover background */
          box-shadow: 0 4px 15px ${accentColor}33; /* More pronounced shadow */
          transform: translateY(-2px); /* Subtle lift effect */
        }
        .zip-display:hover {
          background-color: rgba(255, 193, 7, 0.1); /* Subtle yellow background on hover */
        }
      `}</style>

      {/* Selection style for zip input */}
      <style jsx>{`
        .zip-input::selection { background: rgba(255,193,7,0.15); color: ${accentColor}; }
      `}</style>

      {/* Ticker-style store list with animations */}
      <div className="ticker-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {sortedStores.map((s, idx) => (
          <div key={s.store + idx} className={`store-item${expandedIndex === idx ? ' active' : ''}`}>
            <div
              className="ticker-row store-row"
              onMouseEnter={() => onHoverStore && onHoverStore(s.store)}
              onMouseLeave={() => onHoverStore && onHoverStore(null)}
              onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              style={{
                cursor: 'pointer',
                padding: '16px',
              }}
            >
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '4px'
              }}>
                {s.store}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#aaa',
                marginBottom: '12px',
                paddingLeft: '24px'
              }}>
                {s.distance?.toFixed(1)} MI — {formatAddress(s.address).display}
              </div>
              
              {/* New Price Display Section */}
              <div style={{
                display: 'flex', 
                justifyContent: 'space-around', // Distribute space between price columns
                alignItems: 'flex-start', // Align items at the top
                paddingLeft: '24px', 
                paddingRight: '24px', 
                marginTop: '8px' 
              }}>
                {/* Regular Price Column */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '8px', 
                    color: '#aaa', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    marginBottom: '4px'
                  }}>Regular</div>
                  <div style={{
                    fontSize: '1.35rem', // Larger price font size
                    fontWeight: 'bold',
                    color: '#fff',
                    lineHeight: '1.2', // Adjust line height for large font
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    {formatPrice(s.regular)} 
                    {/* Conditional pulse animation */}
                    {s.regularChange != null && s.regularChange !== 0 ? (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ display: 'inline-block' }} // Needed for motion span layout
                      >
                        {formatChange(s.regularChange)}
                      </motion.span>
                    ) : (
                      formatChange(s.regularChange) // Render non-pulsing version for 0% change
                    )}
                  </div>
                </div>

                {/* Organic Price Column */}
                 <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '8px', 
                    color: '#aaa', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    marginBottom: '4px'
                  }}>Organic</div>
                  <div style={{
                    fontSize: '1.35rem', // Larger price font size
                    fontWeight: 'bold',
                    color: '#fff',
                    lineHeight: '1.2', // Adjust line height for large font
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    {formatPrice(s.organic)}
                     {/* Conditional pulse animation */}
                    {s.organicChange != null && s.organicChange !== 0 ? (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                         style={{ display: 'inline-block' }}
                      >
                        {formatChange(s.organicChange)}
                      </motion.span>
                    ) : (
                      formatChange(s.organicChange)
                    )}
                  </div>
                </div>
              </div>

              {/* Sparkline preview when collapsed */}
              {expandedIndex !== idx && (
                <div style={{ width: '100%', paddingLeft: '24px', paddingRight: '24px', marginTop: '8px', height: '3rem' }}>
                  <EggPriceChart store={s} preview />
                </div>
              )}
              <div className="hint">View pricing history →</div>
            </div>
            {expandedIndex === idx && (
              <div
                className="price-history-panel"
                style={{
                  padding: '12px 16px',
                  background: '#1a1a1a',
                  border: `1px solid #282828`, 
                  borderRadius: '8px',
                  margin: '8px 0 0 0',
                  overflow: 'visible'
                }}
              >
                <EggPriceChart store={s} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

{/* Removed unused global pulse animation */}
<style jsx global>{`
`}</style> 