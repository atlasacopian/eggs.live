'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EggPriceChart from './EggPriceChart'
import { motion, AnimatePresence } from 'framer-motion'

export default function EggPriceViews({ zipCode: initialZipCode = '90026', stores = [], onHoverStore, onSelectStore, lastUpdated, avgRegLA, avgOrgLA, avgRegNat, avgRegNatDate, avgOrgNat }) {
  const accentColor = '#ffc107' // Yolk yellow
  const [sortBy, setSortBy] = useState('distance') // Default sort by distance
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentZip, setCurrentZip] = useState(initialZipCode)
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [activePriceType, setActivePriceType] = useState('regular')
  const [locationInfo, setLocationInfo] = useState({ city: null, state: null, loading: true });

  useEffect(() => {
    setCurrentZip(initialZipCode);
  }, [initialZipCode]);

  // Fetch City/State when ZIP changes
  useEffect(() => {
    if (currentZip && currentZip.length === 5) {
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
        // Reset if zip is invalid
        setLocationInfo({ city: null, state: null, loading: false });
    }
  }, [currentZip]); // Re-run when zip changes

  useEffect(() => {
    setActivePriceType('regular')
  }, [expandedIndex])

  const router = useRouter()

  // Create a formatter with local timezone for date & time
  const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZoneName: 'short'
  });
  // Parse avgRegNatDate to display without timezone artifact
  const formatApiDate = (isoDate) => {
    const [year, month, day] = isoDate.split('-');
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  };
  // Format updatedTime from API or fallback to now
  const updatedTime = lastUpdated
    ? dateTimeFormatter.format(new Date(lastUpdated))
    : dateTimeFormatter.format(new Date());

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

  // Map incoming store props to dataset array
  const dataset = stores.map(s => ({
    store: s.name ?? s.store ?? 'Unknown Store',
    address: s.address ?? 'No Address',
    distance: typeof s.distance === 'number' ? s.distance : null,
    regular: typeof s.regular_price === 'number' ? s.regular_price : null,
    regularChange: typeof s.regular_change === 'number' ? s.regular_change : null,
    organic: typeof s.organic_price === 'number' ? s.organic_price : null,
    organicChange: typeof s.organic_change === 'number' ? s.organic_change : null,
    store_identifier: s.store_identifier
  }));

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
  // Compute delta vs city-wide LA averages
  const pctRegVsLA = avgRegLA ? ((avgReg - avgRegLA) / avgRegLA) * 100 : null
  const pctOrgVsLA = avgOrgLA ? ((avgOrg - avgOrgLA) / avgOrgLA) * 100 : null
  // Find highest organic price
  const getMostExpensive = (key) => {
    if (!availableStores.length) return { price: null, change: null, store: null, address: null }
    const sorted = [...availableStores].filter(s => s[key] != null).sort((a,b) => b[key] - a[key])
    const top = sorted[0]
    return top ? { price: top[key], change: top[`${key}Change`], store: top.store, address: top.address } : { price: null, change: null, store: null, address: null }
  }
  const mostExpOrg = getMostExpensive('organic')

  /* ---------- Render ---------- */
  return (
    <div className="egg-price-views-wrapper" style={{ 
      maxWidth: 960, 
      width: '100%', 
      margin: '80px auto 0', 
      fontFamily: 'Roboto Mono, monospace', 
      color: '#fff', 
      padding:'24px', 
      background: 'transparent', 
      borderRadius: 0
    }}>
      {/* Premium header card split into two panels */}
      <motion.div className="header-cards"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}
      >
        {/* Panel 1: Location & ZIP */}
        <motion.div whileHover={{ borderColor: accentColor, background: '#111', y: -2 }} style={{ flex: 1, background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          <div style={{ fontSize: '11px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            EGG PRICES, PER DOZEN<br/>
            IN LOS ANGELES, CA
          </div>
          <div style={{ fontSize: '56px', fontWeight: 700, color: '#fff', letterSpacing: '0.25ch', marginBottom: '6px' }}>
            {currentZip}
          </div>
          <div style={{ fontSize: '9px', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
            <span className="pulsing-dot" /> Last Updated: {updatedTime}
          </div>
        </motion.div>
        {/* Panel 2: Averages & Deals */}
        <motion.div className="stats-panel" whileHover={{ borderColor: accentColor, background: '#111', y: -2 }} style={{ flex: 1, background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '16px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.025em', cursor: 'pointer' }}>
          <div className="stats-header" style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '6px', transition: 'border-bottom-color 0.2s ease' }}>🥚 MARKET STATS</div>
          <div style={{ marginBottom: '10px', lineHeight: 1.3 }}>
            <div>Lowest Price: <strong>{formatPrice(cheapestReg.price)}</strong> Regular @ <a href={formatAddress(cheapestReg.address).link} target="_blank" rel="noopener noreferrer" className="address-link">{cheapestReg.store}</a></div>
            <div>Highest Price: <strong>{formatPrice(mostExpOrg.price)}</strong> Organic @ <a href={formatAddress(mostExpOrg.address).link} target="_blank" rel="noopener noreferrer" className="address-link">{mostExpOrg.store}</a></div>
          </div>
          <div style={{ marginBottom: '10px', lineHeight: 1.3 }}>
            <div>Regular Avg: <strong>{formatPrice(avgReg)}</strong> {pctRegVsLA != null && (<span style={{ marginLeft: 4, fontWeight: 600 }}>(<span style={{ color: pctRegVsLA < 0 ? '#FF0000' : '#00FF00' }}>{pctRegVsLA < 0 ? '↓' : '↑'}{Math.abs(pctRegVsLA).toFixed(1)}%</span> vs LA)</span>)}</div>
            <div>Organic Avg: <strong>{formatPrice(avgOrg)}</strong> {pctOrgVsLA != null && (<span style={{ marginLeft: 4, fontWeight: 600 }}>(<span style={{ color: pctOrgVsLA < 0 ? '#FF0000' : '#00FF00' }}>{pctOrgVsLA < 0 ? '↓' : '↑'}{Math.abs(pctOrgVsLA).toFixed(1)}%</span> vs LA)</span>)}</div>
          </div>
          {avgRegNat != null && avgRegNatDate && (
            <div style={{ marginBottom: '6px', lineHeight: 1.3 }}>
              Regular National Avg: <strong>{formatPrice(avgRegNat)}</strong>{' '}
              <span style={{ color: '#aaa' }}>(as of {formatApiDate(avgRegNatDate)})</span>
            </div>
          )}
          {avgOrgNat != null && (<div style={{ marginBottom: '0px', lineHeight: 1.3 }}>National Organic Avg: <strong>{formatPrice(avgOrgNat)}</strong></div>)}
        </motion.div>
      </motion.div>

      {/* Styles for hint text visibility on hover */}
      <style jsx>{`
        .store-item {
          background: #000;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          margin-bottom: 8px;
        }
        .store-item .hint { color: #0070f3; } /* Light accent for hint */
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
          border-color: ${accentColor}aa; /* Slightly softer neon border */
          background: #111; /* Slightly lighter hover background */
          box-shadow: 0 4px 15px ${accentColor}33; /* More pronounced shadow */
          transform: translateY(-2px); /* Subtle lift effect */
        }
        .zip-display {
          position: relative;
          width: 6ch;
          font-size: 25px;
          font-weight: 700;
          line-height: 1;
          display: inline-block;
          margin-bottom: 8px;
          cursor: pointer;
          text-align: center;
          font-variant-numeric: tabular-nums;
          padding: 0;
          color: inherit;
        }
        .zip-text { letter-spacing: 0.2ch; }
        .zip-display:hover {
          background-color: rgba(255, 193, 7, 0.1); /* Subtle yellow background on hover */
        }
        /* Removed underline for zip-display */
        /* Ensure input shares same numeric spacing */
        .zip-input {
          font-variant-numeric: tabular-nums;
        }
        /* Pulsing dot to indicate active update */
        @keyframes radar {
          0% { transform: scale(0.5); box-shadow: 0 0 0 0 ${accentColor}; opacity: 1; }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255,193,7,0); opacity: 0; }
          100% { transform: scale(0.5); box-shadow: 0 0 0 0 rgba(255,193,7,0); opacity: 1; }
        }
        .pulsing-dot {
          display: inline-block;
          width: 0.3em;
          height: 0.3em;
          border-radius: 50%;
          background: ${accentColor};
          margin-right: 0.5em;
          animation: radar 2s infinite ease-out;
        }
      `}</style>

      {/* Selection style for zip input */}
      <style jsx>{`
        .zip-input::selection { background: rgba(255,193,7,0.15); color: ${accentColor}; }
      `}</style>

      {/* Address link styling: gray by default, underline on hover */}
      <style jsx>{`
        .address-link,
        .address-link:visited,
        .address-link:link {
          color: #aaa !important;
          text-decoration: none !important;
        }
        .address-link:hover {
          text-decoration: underline !important;
        }
      `}</style>

      {/* Stats header divider color on panel hover */}
      <style jsx>{`
        .stats-panel:hover .stats-header {
          border-bottom-color: ${accentColor};
        }
      `}</style>

      {/* Store cards in a single horizontal scrollable row */}
      <div className="ticker-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedStores.map((s, idx) => (
          <div key={s.store + idx} className={`store-item${expandedIndex === idx ? ' active' : ''}`}>  
            <div className="ticker-row store-row" onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px' }}>  
              {/* Left: store & address */}  
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>  
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🥚 {s.store}</span>  
                <span style={{ fontSize: '0.75rem', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>  
                  {s.distance?.toFixed(1)} MI - <a href={formatAddress(s.address).link} target="_blank" rel="noopener noreferrer" className="address-link">{formatAddress(s.address).display}</a>  
                </span>  
              </div>  
              {/* Right: prices, sparkline & toggle */}  
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>  
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>  
                  <div style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Reg</div>  
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>{formatPrice(s.regular)}</div>  
                  {s.regularChange != null && s.regularChange !== 0 ? (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ display: 'block', marginTop: 4, color: s.regularChange < 0 ? '#FF0000' : '#00FF00', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      {s.regularChange < 0 ? '↓' : '↑'}{Math.abs(s.regularChange).toFixed(1)}%
                    </motion.span>
                  ) : (
                    <span style={{ display: 'block', marginTop: 4, color: '#888', fontWeight: 600, fontSize: '0.75rem' }}>→0.0%</span>
                  )}  
                </div>  
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '16px' }}>  
                  <div style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase' }}>Org</div>  
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>{formatPrice(s.organic)}</div>  
                  {s.organicChange != null && s.organicChange !== 0 ? (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ display: 'block', marginTop: 4, color: s.organicChange < 0 ? '#FF0000' : '#00FF00', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      {s.organicChange < 0 ? '↓' : '↑'}{Math.abs(s.organicChange).toFixed(1)}%
                    </motion.span>
                  ) : (
                    <span style={{ display: 'block', marginTop: 4, color: '#888', fontWeight: 600, fontSize: '0.75rem' }}>→0.0%</span>
                  )}  
                </div>  
                <div style={{ width: 80, height: 24 }}>  
                  <EggPriceChart store={s} preview priceType="regular" />  
                </div>  
                <span className="hint" style={{ whiteSpace: 'nowrap' }}>{expandedIndex === idx ? 'Hide history ↓' : 'View history →'}</span>  
              </div>  
            </div>  
            <AnimatePresence>
              {expandedIndex === idx && (
                <motion.div
                  className="price-history-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '12px 16px',
                    background: 'inherit',
                    border: 'none',
                    borderRadius: '0 0 8px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <EggPriceChart store={s} priceType={activePriceType} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '90%', margin: '8px auto 0' }}>
                    <span
                      onClick={() => setActivePriceType('regular')}
                      style={{
                        cursor: 'pointer',
                        color: activePriceType === 'regular' ? accentColor : '#888',
                        textTransform: 'uppercase',
                        fontWeight: activePriceType === 'regular' ? 'bold' : 'normal',
                        fontSize: '0.75rem'
                      }}
                    >REGULAR</span>
                    <span
                      onClick={() => setActivePriceType('organic')}
                      style={{
                        cursor: 'pointer',
                        color: activePriceType === 'organic' ? accentColor : '#888',
                        textTransform: 'uppercase',
                        fontWeight: activePriceType === 'organic' ? 'bold' : 'normal',
                        fontSize: '0.75rem'
                      }}
                    >ORGANIC</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Responsive adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .header-cards {
            flex-direction: column;
          }
          .egg-price-views-wrapper {
            margin: 40px auto 0 !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}