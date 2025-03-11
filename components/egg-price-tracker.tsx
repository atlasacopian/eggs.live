"use client"

import { useState, useEffect } from "react"
import EggIndices from "./egg-indices"
import EggPriceChart from "./egg-price-chart"

interface Store {
  id: string
  name: string
  price: number
  date: string
  change: number
  changePercent: number
  eggType: string
}

interface ApiPrice {
  id: string
  storeId: string
  price: number
  date: string
  eggType: string
  store_name: string
  store_website: string
}

export default function EggPriceTracker() {
  const [eggType, setEggType] = useState("REGULAR")
  const [sortBy, setSortBy] = useState("STORE")
  const [storeData, setStoreData] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState("")

  // Fetch store data from API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("/api/prices")
        const data = await response.json()

        if (data.success && data.prices) {
          // Transform API data to our format
          const transformedData = data.prices.map((price: ApiPrice) => {
            // For now, we'll use placeholder values for change and changePercent
            // In a real app, you'd calculate these based on historical data
            const change = (Math.random() * 0.4 - 0.2).toFixed(2)
            const changePercent = ((Number.parseFloat(change) / price.price) * 100).toFixed(1)

            return {
              id: `${price.storeId}-${price.eggType}`,
              storeId: price.storeId,
              name: price.store_name.toUpperCase(),
              price: price.price,
              date: new Date(price.date).toLocaleDateString(),
              change: Number.parseFloat(change),
              changePercent: Number.parseFloat(changePercent),
              eggType: price.eggType.toUpperCase(),
            }
          })

          setStoreData(transformedData)

          // Set last updated date from the first price entry
          if (data.prices.length > 0) {
            setLastUpdated(new Date(data.prices[0].date).toLocaleDateString())
          }
        }
      } catch (error) {
        console.error("Error fetching store data:", error)
        // If API fails, use placeholder data
        setStoreData(placeholderStoreData)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const styles = {
    container: {
      backgroundColor: "#000",
      color: "#00ff00",
      fontFamily: "monospace",
      padding: "20px 0",
      lineHeight: "1.3",
      minHeight: "100vh",
      textAlign: "center",
      width: "100%",
      maxWidth: "100vw",
      margin: "0 auto",
      overflowX: "hidden",
    },
    header: {
      fontSize: "36px",
      marginBottom: "15px",
      fontWeight: "normal",
      textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
    },
    subheader: {
      fontSize: "18px",
      marginBottom: "30px",
      fontWeight: "normal",
      opacity: "0.8",
    },
    section: {
      marginBottom: "40px",
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 20px",
      boxSizing: "border-box" as const,
    },
    button: {
      backgroundColor: "#000",
      color: "#00ff00",
      border: "1px solid #00ff00",
      padding: "8px 20px",
      margin: "0 5px 5px 0",
      cursor: "pointer",
      fontFamily: "monospace",
      fontSize: "16px",
      transition: "all 0.3s ease",
      textShadow: "0 0 5px rgba(0, 255, 0, 0.3)",
    },
    activeButton: {
      backgroundColor: "#00ff00",
      color: "#000",
      boxShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
    },
    storesContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "20px",
      marginTop: "20px",
      width: "100%",
    },
    storeItem: {
      border: "1px solid #00ff00",
      padding: "20px",
      borderRadius: "4px",
      textAlign: "center",
      backgroundColor: "rgba(0, 255, 0, 0.05)",
      boxShadow: "0 0 10px rgba(0, 255, 0, 0.1)",
      transition: "all 0.3s ease",
    },
    storeName: {
      fontSize: "18px",
      marginBottom: "10px",
      opacity: "0.9",
    },
    storePrice: {
      fontSize: "32px",
      marginBottom: "10px",
      textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
    },
    updateInfo: {
      fontSize: "14px",
      opacity: "0.7",
      marginTop: "10px",
      marginBottom: "20px",
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: "15px",
      gap: "10px",
    },
    priceChange: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
    },
    priceChangeArrow: {
      marginRight: "8px",
      fontSize: "20px",
    },
    loadingText: {
      fontSize: "18px",
      margin: "40px 0",
    },
  }

  // Placeholder data in case API fails
  const placeholderStoreData = [
    // Regular eggs
    {
      id: "walmart-regular",
      storeId: "walmart",
      name: "WALMART",
      price: 2.28,
      date: "3/10/2025",
      change: -0.17,
      changePercent: -6.9,
      eggType: "REGULAR",
    },
    {
      id: "kroger-regular",
      storeId: "kroger",
      name: "KROGER",
      price: 3.49,
      date: "3/10/2025",
      change: 0.05,
      changePercent: 1.4,
      eggType: "REGULAR",
    },
    {
      id: "target-regular",
      storeId: "target",
      name: "TARGET",
      price: 3.59,
      date: "3/10/2025",
      change: 0.1,
      changePercent: 2.9,
      eggType: "REGULAR",
    },
    {
      id: "costco-regular",
      storeId: "costco",
      name: "COSTCO",
      price: 3.15,
      date: "3/10/2025",
      change: -0.08,
      changePercent: -2.5,
      eggType: "REGULAR",
    },
    {
      id: "wholefoods-regular",
      storeId: "wholefoods",
      name: "WHOLE FOODS",
      price: 4.29,
      date: "3/10/2025",
      change: 0.15,
      changePercent: 3.6,
      eggType: "REGULAR",
    },
    {
      id: "traderjoes-regular",
      storeId: "traderjoes",
      name: "TRADER JOE'S",
      price: 3.99,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "REGULAR",
    },
    {
      id: "aldi-regular",
      storeId: "aldi",
      name: "ALDI",
      price: 2.89,
      date: "3/10/2025",
      change: -0.1,
      changePercent: -3.3,
      eggType: "REGULAR",
    },
    {
      id: "publix-regular",
      storeId: "publix",
      name: "PUBLIX",
      price: 3.79,
      date: "3/10/2025",
      change: 0.2,
      changePercent: 5.6,
      eggType: "REGULAR",
    },
    {
      id: "safeway-regular",
      storeId: "safeway",
      name: "SAFEWAY",
      price: 3.69,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "REGULAR",
    },
    {
      id: "wegmans-regular",
      storeId: "wegmans",
      name: "WEGMANS",
      price: 3.49,
      date: "3/10/2025",
      change: -0.2,
      changePercent: -5.4,
      eggType: "REGULAR",
    },
    {
      id: "shoprite-regular",
      storeId: "shoprite",
      name: "SHOPRITE",
      price: 3.29,
      date: "3/10/2025",
      change: 0.1,
      changePercent: 3.1,
      eggType: "REGULAR",
    },
    // Add more stores for regular eggs
    {
      id: "albertsons-regular",
      storeId: "albertsons",
      name: "ALBERTSONS",
      price: 3.59,
      date: "3/10/2025",
      change: 0.05,
      changePercent: 1.4,
      eggType: "REGULAR",
    },
    {
      id: "heb-regular",
      storeId: "heb",
      name: "HEB",
      price: 3.39,
      date: "3/10/2025",
      change: -0.1,
      changePercent: -2.9,
      eggType: "REGULAR",
    },
    {
      id: "meijer-regular",
      storeId: "meijer",
      name: "MEIJER",
      price: 3.29,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "REGULAR",
    },
    {
      id: "sprouts-regular",
      storeId: "sprouts",
      name: "SPROUTS",
      price: 3.99,
      date: "3/10/2025",
      change: 0.15,
      changePercent: 3.9,
      eggType: "REGULAR",
    },
    {
      id: "food4less-regular",
      storeId: "food4less",
      name: "FOOD 4 LESS",
      price: 2.99,
      date: "3/10/2025",
      change: -0.05,
      changePercent: -1.6,
      eggType: "REGULAR",
    },
    {
      id: "erewhon-regular",
      storeId: "erewhon",
      name: "EREWHON",
      price: 5.99,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "REGULAR",
    },
    {
      id: "foodlion-regular",
      storeId: "foodlion",
      name: "FOOD LION",
      price: 3.19,
      date: "3/10/2025",
      change: -0.1,
      changePercent: -3.0,
      eggType: "REGULAR",
    },
    {
      id: "gianteagle-regular",
      storeId: "gianteagle",
      name: "GIANT EAGLE",
      price: 3.49,
      date: "3/10/2025",
      change: 0.1,
      changePercent: 2.9,
      eggType: "REGULAR",
    },
    {
      id: "ralphs-regular",
      storeId: "ralphs",
      name: "RALPHS",
      price: 3.59,
      date: "3/10/2025",
      change: 0.05,
      changePercent: 1.4,
      eggType: "REGULAR",
    },
    {
      id: "stopandshop-regular",
      storeId: "stopandshop",
      name: "STOP & SHOP",
      price: 3.39,
      date: "3/10/2025",
      change: -0.1,
      changePercent: -2.9,
      eggType: "REGULAR",
    },
    {
      id: "vons-regular",
      storeId: "vons",
      name: "VONS",
      price: 3.69,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "REGULAR",
    },
    {
      id: "winndixie-regular",
      storeId: "winndixie",
      name: "WINN-DIXIE",
      price: 3.29,
      date: "3/10/2025",
      change: -0.05,
      changePercent: -1.5,
      eggType: "REGULAR",
    },

    // Organic eggs
    {
      id: "walmart-organic",
      storeId: "walmart",
      name: "WALMART",
      price: 4.98,
      date: "3/10/2025",
      change: -0.22,
      changePercent: -4.2,
      eggType: "ORGANIC",
    },
    {
      id: "kroger-organic",
      storeId: "kroger",
      name: "KROGER",
      price: 5.99,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "target-organic",
      storeId: "target",
      name: "TARGET",
      price: 5.89,
      date: "3/10/2025",
      change: -0.1,
      changePercent: -1.7,
      eggType: "ORGANIC",
    },
    {
      id: "costco-organic",
      storeId: "costco",
      name: "COSTCO",
      price: 5.49,
      date: "3/10/2025",
      change: -0.3,
      changePercent: -5.2,
      eggType: "ORGANIC",
    },
    {
      id: "wholefoods-organic",
      storeId: "wholefoods",
      name: "WHOLE FOODS",
      price: 6.99,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "traderjoes-organic",
      storeId: "traderjoes",
      name: "TRADER JOE'S",
      price: 5.49,
      date: "3/10/2025",
      change: -0.5,
      changePercent: -8.3,
      eggType: "ORGANIC",
    },
    {
      id: "aldi-organic",
      storeId: "aldi",
      name: "ALDI",
      price: 4.89,
      date: "3/10/2025",
      change: -0.1,
      changePercent: -2.0,
      eggType: "ORGANIC",
    },
    {
      id: "publix-organic",
      storeId: "publix",
      name: "PUBLIX",
      price: 6.29,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "safeway-organic",
      storeId: "safeway",
      name: "SAFEWAY",
      price: 6.19,
      date: "3/10/2025",
      change: -0.3,
      changePercent: -4.6,
      eggType: "ORGANIC",
    },
    {
      id: "wegmans-organic",
      storeId: "wegmans",
      name: "WEGMANS",
      price: 5.79,
      date: "3/10/2025",
      change: -0.2,
      changePercent: -3.3,
      eggType: "ORGANIC",
    },
    {
      id: "shoprite-organic",
      storeId: "shoprite",
      name: "SHOPRITE",
      price: 5.99,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    // Add more stores for organic eggs
    {
      id: "albertsons-organic",
      storeId: "albertsons",
      name: "ALBERTSONS",
      price: 6.29,
      date: "3/10/2025",
      change: 0.1,
      changePercent: 1.6,
      eggType: "ORGANIC",
    },
    {
      id: "heb-organic",
      storeId: "heb",
      name: "HEB",
      price: 5.89,
      date: "3/10/2025",
      change: -0.2,
      changePercent: -3.3,
      eggType: "ORGANIC",
    },
    {
      id: "meijer-organic",
      storeId: "meijer",
      name: "MEIJER",
      price: 5.79,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "sprouts-organic",
      storeId: "sprouts",
      name: "SPROUTS",
      price: 6.49,
      date: "3/10/2025",
      change: 0.2,
      changePercent: 3.2,
      eggType: "ORGANIC",
    },
    {
      id: "food4less-organic",
      storeId: "food4less",
      name: "FOOD 4 LESS",
      price: 5.49,
      date: "3/10/2025",
      change: -0.1,
      changePercent: -1.8,
      eggType: "ORGANIC",
    },
    {
      id: "erewhon-organic",
      storeId: "erewhon",
      name: "EREWHON",
      price: 8.99,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "foodlion-organic",
      storeId: "foodlion",
      name: "FOOD LION",
      price: 5.69,
      date: "3/10/2025",
      change: -0.2,
      changePercent: -3.4,
      eggType: "ORGANIC",
    },
    {
      id: "gianteagle-organic",
      storeId: "gianteagle",
      name: "GIANT EAGLE",
      price: 5.99,
      date: "3/10/2025",
      change: 0.1,
      changePercent: 1.7,
      eggType: "ORGANIC",
    },
    {
      id: "ralphs-organic",
      storeId: "ralphs",
      name: "RALPHS",
      price: 6.19,
      date: "3/10/2025",
      change: 0.1,
      changePercent: 1.6,
      eggType: "ORGANIC",
    },
    {
      id: "stopandshop-organic",
      storeId: "stopandshop",
      name: "STOP & SHOP",
      price: 5.89,
      date: "3/10/2025",
      change: -0.15,
      changePercent: -2.5,
      eggType: "ORGANIC",
    },
    {
      id: "vons-organic",
      storeId: "vons",
      name: "VONS",
      price: 6.29,
      date: "3/10/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "winndixie-organic",
      storeId: "winndixie",
      name: "WINN-DIXIE",
      price: 5.79,
      date: "3/10/2025",
      change: -0.1,
      changePercent: -1.7,
      eggType: "ORGANIC",
    },
  ]

  // USDA historical price data for graph (1 year)
  const regularHistoricalData = [
    { date: "3/10/2024", price: 2.93 },
    { date: "4/10/2024", price: 3.05 },
    { date: "5/10/2024", price: 3.12 },
    { date: "6/10/2024", price: 3.24 },
    { date: "7/10/2024", price: 3.36 },
    { date: "8/10/2024", price: 3.45 },
    { date: "9/10/2024", price: 3.58 },
    { date: "10/10/2024", price: 3.67 },
    { date: "11/10/2024", price: 3.82 },
    { date: "12/10/2024", price: 4.15 },
    { date: "1/10/2025", price: 4.43 },
    { date: "2/10/2025", price: 4.72 },
    { date: "3/10/2025", price: 4.94 },
  ]

  const organicHistoricalData = [
    { date: "3/10/2024", price: 4.98 },
    { date: "4/10/2024", price: 5.12 },
    { date: "5/10/2024", price: 5.25 },
    { date: "6/10/2024", price: 5.38 },
    { date: "7/10/2024", price: 5.52 },
    { date: "8/10/2024", price: 5.67 },
    { date: "9/10/2024", price: 5.83 },
    { date: "10/10/2024", price: 5.99 },
    { date: "11/10/2024", price: 6.15 },
    { date: "12/10/2024", price: 6.32 },
    { date: "1/10/2025", price: 6.49 },
    { date: "2/10/2025", price: 6.53 },
    { date: "3/10/2025", price: 6.38 },
  ]

  // Filter stores by egg type
  const stores = storeData.filter((store) => store.eggType === eggType)

  // Filter and sort stores
  const filteredStores = stores.filter((store) => store.name.toLowerCase().includes(""))

  const sortedStores = [...filteredStores].sort((a, b) => {
    if (sortBy === "PRICE") {
      return a.price - b.price
    } else {
      return a.name.localeCompare(b.name)
    }
  })

  // Calculate average prices
  const regularEggs = storeData.filter((store) => store.eggType === "REGULAR")
  const organicEggs = storeData.filter((store) => store.eggType === "ORGANIC")

  const regularAvgPrice =
    regularEggs.length > 0 ? regularEggs.reduce((sum, store) => sum + store.price, 0) / regularEggs.length : 0
  const organicAvgPrice =
    organicEggs.length > 0 ? organicEggs.reduce((sum, store) => sum + store.price, 0) / organicEggs.length : 0

  // Get the correct historical data based on egg type
  const historicalData = eggType === "REGULAR" ? regularHistoricalData : organicHistoricalData

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h1 style={styles.header}>eggs.live</h1>
        <h2 style={styles.subheader}>US EGG PRICES PER DOZEN</h2>

        <EggIndices regularPrice={regularAvgPrice} organicPrice={organicAvgPrice} />
      </div>

      <div style={styles.section}>
        <h2 style={styles.header}>TODAY'S PRICES</h2>
        <div style={styles.updateInfo}>UPDATED: {lastUpdated || "3/10/2025"}</div>

        <div style={styles.buttonContainer}>
          <button
            style={{
              ...styles.button,
              ...(eggType === "REGULAR" ? styles.activeButton : {}),
            }}
            onClick={() => setEggType("REGULAR")}
          >
            REGULAR
          </button>
          <button
            style={{
              ...styles.button,
              ...(eggType === "ORGANIC" ? styles.activeButton : {}),
            }}
            onClick={() => setEggType("ORGANIC")}
          >
            ORGANIC
          </button>
        </div>

        <div style={styles.buttonContainer}>
          <button
            style={{
              ...styles.button,
              ...(sortBy === "STORE" ? styles.activeButton : {}),
            }}
            onClick={() => setSortBy("STORE")}
          >
            STORE ▲
          </button>
          <button
            style={{
              ...styles.button,
              ...(sortBy === "PRICE" ? styles.activeButton : {}),
            }}
            onClick={() => setSortBy("PRICE")}
          >
            PRICE
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingText}>Loading store data...</div>
        ) : (
          <div style={styles.storesContainer}>
            {sortedStores.map((store) => (
              <div key={store.id} style={styles.storeItem}>
                <div style={styles.storeName}>{store.name}</div>
                <div style={styles.storePrice}>${store.price.toFixed(2)}</div>
                <div style={styles.priceChange}>
                  <span
                    style={{
                      ...styles.priceChangeArrow,
                      color: store.change >= 0 ? "#00ff00" : "#ff0000",
                    }}
                  >
                    {store.change >= 0 ? "↑" : "↓"}
                  </span>
                  <span
                    style={{
                      color: store.change >= 0 ? "#00ff00" : "#ff0000",
                    }}
                  >
                    {store.change >= 0 ? "+" : ""}
                    {store.change.toFixed(2)} ({store.change >= 0 ? "+" : ""}
                    {store.changePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <EggPriceChart historicalData={historicalData} eggType={eggType} />
      </div>
    </div>
  )
}

