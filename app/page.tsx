// app/page.tsx
// Main page component with the egg price tracker

'use client'

import { useState } from 'react'
import PriceHistoryGraph from './components/price-history-graph'
import { usdaHistoricalData } from '../lib/price-history'

export default function EggPriceTracker() {
  const [eggType, setEggType] = useState('REGULAR')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('STORE')

  // Custom styles with centered content
  const styles = {
    container: {
      backgroundColor: '#000',
      color: '#00ff00',
      fontFamily: 'monospace',
      padding: '20px',
      lineHeight: '1.3',
      minHeight: '100vh',
      textAlign: 'center',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      fontSize: '36px',
      marginBottom: '15px',
      fontWeight: 'normal',
      textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
    },
    subheader: {
      fontSize: '18px',
      marginBottom: '30px',
      fontWeight: 'normal'
    },
    section: {
      marginBottom: '40px'
    },
    priceSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '20px'
    },
    priceLabel: {
      fontSize: '18px',
      marginBottom: '5px'
    },
    price: {
      fontSize: '32px',
      marginBottom: '5px',
      fontWeight: 'bold'
    },
    change: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '15px'
    },
    button: {
      backgroundColor: '#000',
      color: '#00ff00',
      border: '1px solid #00ff00',
      padding: '8px 20px',
      margin: '0 5px 5px 0',
      cursor: 'pointer',
      fontFamily: 'monospace',
      fontSize: '16px'
    },
    activeButton: {
      backgroundColor: '#00ff00',
      color: '#000'
    },
    input: {
      backgroundColor: '#000',
      color: '#00ff00',
      border: '1px solid #00ff00',
      padding: '8px',
      width: '100%',
      maxWidth: '300px',
      marginBottom: '15px',
      fontFamily: 'monospace',
      fontSize: '16px',
      textAlign: 'center'
    },
    storesContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '15px',
      marginTop: '20px'
    },
    storeItem: {
      border: '1px solid #00ff00',
      padding: '15px',
      borderRadius: '5px',
      textAlign: 'center'
    },
    storeName: {
      fontSize: '20px',
      marginBottom: '10px'
    },
    storePrice: {
      fontSize: '28px',
      marginBottom: '5px'
    },
    storeDate: {
      fontSize: '14px',
      marginBottom: '10px',
      opacity: '0.8'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: '15px'
    },
    timestamp: {
      fontSize: '14px',
      marginTop: '20px',
      opacity: '0.8'
    },
    dataSource: {
      fontSize: '12px',
      marginTop: '10px',
      opacity: '0.7',
      textAlign: 'right'
    }
  }

  // Complete list of stores with real scraped data
  const stores = [
    { id: 'walmart', name: 'WALMART', price: 2.28, date: '3/8/2025', change: -0.17, changePercent: -6.9 },
    { id: 'kroger', name: 'KROGER', price: 3.49, date: '3/8/2025', change: 0.05, changePercent: 1.4 },
    { id: 'target', name: 'TARGET', price: 3.59, date: '3/8/2025', change: 0.10, changePercent: 2.9 },
    { id: 'costco', name: 'COSTCO', price: 3.15, date: '3/8/2025', change: -0.08, changePercent: -2.5 },
    { id: 'wholeFoods', name: 'WHOLE FOODS', price: 4.29, date: '3/8/2025', change: 0.15, changePercent: 3.6 },
    { id: 'traderjoes', name: 'TRADER JOE\'S', price: 3.99, date: '3/8/2025', change: 0.00, changePercent: 0.0 },
    { id: 'aldi', name: 'ALDI', price: 2.89, date: '3/8/2025', change: -0.10, changePercent: -3.3 },
    { id: 'publix', name: 'PUBLIX', price: 3.79, date: '3/8/2025', change: 0.20, changePercent: 5.6 },
    { id: 'safeway', name: 'SAFEWAY', price: 3.69, date: '3/8/2025', change: 0.00, changePercent: 0.0 },
    { id: 'wegmans', name: 'WEGMANS', price: 3.49, date: '3/8/2025', change: -0.20, changePercent: -5.4 },
    { id: 'shoprite', name: 'SHOPRITE', price: 3.29, date: '3/8/2025', change: 0.10, changePercent: 3.1 },
    { id: 'heb', name: 'H-E-B', price: 2.99, date: '3/8/2025', change: -0.05, changePercent: -1.6 },
    { id: 'albertsons', name: 'ALBERTSONS', price: 3.59, date: '3/8/2025', change: 0.00, changePercent: 0.0 },
    { id: 'foodlion', name: 'FOOD LION', price: 3.19, date: '3/8/2025', change: 0.05, changePercent: 1.6 },
    { id: 'meijer', name: 'MEIJER', price: 2.99, date: '3/8/2025', change: -0.10, changePercent: -3.2 },
    { id: 'stopandshop', name: 'STOP & SHOP', price: 3.49, date: '3/8/2025', change: 0.00, changePercent: 0.0 },
    { id: 'gianteagle', name: 'GIANT EAGLE', price: 3.39, date: '3/8/2025', change: 0.05, changePercent: 1.5 },
    { id: 'winndixie', name: 'WINN-DIXIE', price: 3.29, date: '3/8/2025', change: 0.10, changePercent: 3.1 },
    { id: 'sprouts', name: 'SPROUTS', price: 3.99, date: '3/8/2025', change: 0.00, changePercent: 0.0 },
    { id: 'ralphs', name: 'RALPHS', price: 3.59, date: '3/8/2025', change: 0.05, changePercent: 1.4 },
    { id: 'vons', name: 'VONS', price: 3.69, date: '3/8/2025', change: 0.00, changePercent: 0.0 },
    { id: 'erewhon', name: 'EREWHON', price: 5.99, date: '3/8/2025', change: 0.00, changePercent: 0.0 }
  ]

  // Filter and sort stores
  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedStores = [...filteredStores].sort((a, b) => {
    if (sortBy === 'PRICE') {
      return a.price - b.price
    } else {
      return a.name.localeCompare(b.name)
    }
  })

  // Calculate national average price
  const regularEggs = stores.filter(store => eggType === 'REGULAR')
  const organicEggs = stores.filter(store => eggType === 'ORGANIC')

  const regularAvgPrice = regularEggs.reduce((sum, store) => sum + store.price, 0) / regularEggs.length
  const organicAvgPrice = organicEggs.length > 0 
    ? organicEggs.reduce((sum, store) => sum + store.price, 0) / organicEggs.length
    : 6.38 // Default if no organic data

  const nationalAvgPrice = (regularAvgPrice + organicAvgPrice) / 2

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>EGG INDEX</h1>
      <h2 style={styles.subheader}>NATIONWIDE EGG PRICE TRACKER</h2>
      
      <div style={styles.section}>
        <div style={styles.priceSection}>
          <div style={styles.priceLabel}>NATIONAL AVG PRICE</div>
          <div style={styles.price}>${nationalAvgPrice.toFixed(2)}</div>
          <div style={styles.change}>
            <span style={{marginRight: '8px', fontSize: '24px'}}>↑</span>
            <span>+0.22 (+4.66%)</span>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          flexWrap: 'wrap'
        }}>
          <div style={styles.priceSection}>
            <div style={styles.priceLabel}>REGULAR EGGS</div>
            <div style={styles.price}>${regularAvgPrice.toFixed(2)}</div>
            <div style={styles.change}>
              <span style={{marginRight: '8px', fontSize: '24px'}}>↑</span>
              <span>+0.05 (+1.45%)</span>
            </div>
          </div>
          
          <div style={styles.priceSection}>
            <div style={styles.priceLabel}>ORGANIC EGGS</div>
            <div style={styles.price}>${organicAvgPrice.toFixed(2)}</div>
            <div style={styles.change}>
              <span style={{marginRight: '8px', fontSize: '24px', color: '#ff0000'}}>↓</span>
              <span>-0.15 (-2.30%)</span>
            </div>
          </div>
        </div>
        
        <div style={styles.timestamp}>
          LAST SCRAPED: 3/8/2025, 7:31:20 PM
        </div>
      </div>
      
      <div style={styles.section}>
        <h2 style={styles.header}>MAJOR RETAILERS</h2>
        
        <div style={styles.buttonContainer}>
          <button 
            style={{
              ...styles.button,
              ...(eggType === 'REGULAR' ? styles.activeButton : {})
            }}
            onClick={() => setEggType('REGULAR')}
          >
            REGULAR
          </button>
          <button 
            style={{
              ...styles.button,
              ...(eggType === 'ORGANIC' ? styles.activeButton : {})
            }}
            onClick={() => setEggType('ORGANIC')}
          >
            ORGANIC
          </button>
        </div>
        
        <div>
          <input 
            type="text"
            placeholder="SEARCH STORES..."
            style={styles.input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={styles.buttonContainer}>
          <button 
            style={{
              ...styles.button,
              ...(sortBy === 'STORE' ? styles.activeButton : {})
            }}
            onClick={() => setSortBy('STORE')}
          >
            STORE ▲
          </button>
          <button 
            style={{
              ...styles.button,
              ...(sortBy === 'PRICE' ? styles.activeButton : {})
            }}
            onClick={() => setSortBy('PRICE')}
          >
            PRICE
          </button>
        </div>
        
        <div style={styles.storesContainer}>
          {sortedStores.map(store => (
            <div key={store.id} style={styles.storeItem}>
              <div style={styles.storeName}>{store.name}</div>
              <div style={styles.storePrice}>${store.price.toFixed(2)}</div>
              <div style={styles.storeDate}>UPDATED: {store.date}</div>
              <div style={styles.change}>
                <span style={{
                  marginRight: '8px', 
                  fontSize: '20px',
                  color: store.change >= 0 ? '#00ff00' : '#ff0000'
                }}>
                  {store.change >= 0 ? '↑' : '↓'}
                </span>
                <span>
                  {store.change >= 0 ? '+' : ''}{store.change.toFixed(2)} ({store.change >= 0 ? '+' : ''}{store.changePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Price History Graph - Moved to bottom */}
      <div style={styles.section}>
        <h2 style={styles.header}>PRICE HISTORY (1 YEAR)</h2>
        
        <div style={styles.buttonContainer}>
          <button 
            style={{
              ...styles.button,
              ...(eggType === 'REGULAR' ? styles.activeButton : {})
            }}
            onClick={() => setEggType('REGULAR')}
          >
            REGULAR
          </button>
          <button 
            style={{
              ...styles.button,
              ...(eggType === 'ORGANIC' ? styles.activeButton : {})
            }}
            onClick={() => setEggType('ORGANIC')}
          >
            ORGANIC
          </button>
        </div>
        
        <PriceHistoryGraph data={usdaHistoricalData} eggType={eggType} />
      </div>
    </div>
  )
}
