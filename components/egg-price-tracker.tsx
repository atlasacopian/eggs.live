"use client"

import { useState } from "react"
import EggIndices from "./egg-indices"
import EggPriceChart from "./egg-price-chart"

export default function EggPriceTracker() {
  const [eggType, setEggType] = useState("REGULAR")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("STORE")

  // Custom styles with centered content
  const styles = {
    container: {
      backgroundColor: "#000",
      color: "#00ff00",
      fontFamily: "monospace",
      padding: "20px",
      lineHeight: "1.3",
      minHeight: "100vh",
      textAlign: "center",
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      fontSize: "36px",
      marginBottom: "15px",
      fontWeight: "normal",
      textShadow: "0 0 5px rgba(0, 255, 0, 0.5)",
    },
    subheader: {
      fontSize: "18px",
      marginBottom: "30px",
      fontWeight: "normal",
    },
    section: {
      marginBottom: "40px",
      width: "100%",
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
    },
    activeButton: {
      backgroundColor: "#00ff00",
      color: "#000",
    },
    input: {
      backgroundColor: "#000",
      color: "#00ff00",
      border: "1px solid #00ff00",
      padding: "8px",
      width: "100%",
      maxWidth: "300px",
      marginBottom: "15px",
      fontFamily: "monospace",
      fontSize: "16px",
      textAlign: "center",
    },
    storesContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "15px",
      marginTop: "20px",
      width: "100%",
    },
    storeItem: {
      border: "1px solid #00ff00",
      padding: "15px",
      borderRadius: "5px",
      textAlign: "center",
    },
    storeName: {
      fontSize: "20px",
      marginBottom: "10px",
    },
    storePrice: {
      fontSize: "28px",
      marginBottom: "5px",
    },
    storeDate: {
      fontSize: "14px",
      marginBottom: "10px",
      opacity: "0.8",
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: "15px",
    },
    updateInfo: {
      fontSize: "14px",
      marginTop: "20px",
      opacity: "0.8",
    },
  }

  // Store data with egg type
  const storeData = [
    // Regular eggs
    {
      id: "walmart-regular",
      storeId: "walmart",
      name: "WALMART",
      price: 2.28,
      date: "3/8/2025",
      change: -0.17,
      changePercent: -6.9,
      eggType: "REGULAR",
    },
    {
      id: "kroger-regular",
      storeId: "kroger",
      name: "KROGER",
      price: 3.49,
      date: "3/8/2025",
      change: 0.05,
      changePercent: 1.4,
      eggType: "REGULAR",
    },
    {
      id: "target-regular",
      storeId: "target",
      name: "TARGET",
      price: 3.59,
      date: "3/8/2025",
      change: 0.1,
      changePercent: 2.9,
      eggType: "REGULAR",
    },
    {
      id: "costco-regular",
      storeId: "costco",
      name: "COSTCO",
      price: 3.15,
      date: "3/8/2025",
      change: -0.08,
      changePercent: -2.5,
      eggType: "REGULAR",
    },
    {
      id: "wholeFoods-regular",
      storeId: "wholeFoods",
      name: "WHOLE FOODS",
      price: 4.29,
      date: "3/8/2025",
      change: 0.15,
      changePercent: 3.6,
      eggType: "REGULAR",
    },
    {
      id: "traderjoes-regular",
      storeId: "traderjoes",
      name: "TRADER JOE'S",
      price: 3.99,
      date: "3/8/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "REGULAR",
    },
    {
      id: "aldi-regular",
      storeId: "aldi",
      name: "ALDI",
      price: 2.89,
      date: "3/8/2025",
      change: -0.1,
      changePercent: -3.3,
      eggType: "REGULAR",
    },
    {
      id: "publix-regular",
      storeId: "publix",
      name: "PUBLIX",
      price: 3.79,
      date: "3/8/2025",
      change: 0.2,
      changePercent: 5.6,
      eggType: "REGULAR",
    },
    {
      id: "safeway-regular",
      storeId: "safeway",
      name: "SAFEWAY",
      price: 3.69,
      date: "3/8/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "REGULAR",
    },
    {
      id: "wegmans-regular",
      storeId: "wegmans",
      name: "WEGMANS",
      price: 3.49,
      date: "3/8/2025",
      change: -0.2,
      changePercent: -5.4,
      eggType: "REGULAR",
    },
    {
      id: "shoprite-regular",
      storeId: "shoprite",
      name: "SHOPRITE",
      price: 3.29,
      date: "3/8/2025",
      change: 0.1,
      changePercent: 3.1,
      eggType: "REGULAR",
    },

    // Organic eggs
    {
      id: "walmart-organic",
      storeId: "walmart",
      name: "WALMART",
      price: 4.98,
      date: "3/8/2025",
      change: -0.22,
      changePercent: -4.2,
      eggType: "ORGANIC",
    },
    {
      id: "kroger-organic",
      storeId: "kroger",
      name: "KROGER",
      price: 5.99,
      date: "3/8/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "target-organic",
      storeId: "target",
      name: "TARGET",
      price: 5.89,
      date: "3/8/2025",
      change: -0.1,
      changePercent: -1.7,
      eggType: "ORGANIC",
    },
    {
      id: "costco-organic",
      storeId: "costco",
      name: "COSTCO",
      price: 5.49,
      date: "3/8/2025",
      change: -0.3,
      changePercent: -5.2,
      eggType: "ORGANIC",
    },
    {
      id: "wholeFoods-organic",
      storeId: "wholeFoods",
      name: "WHOLE FOODS",
      price: 6.99,
      date: "3/8/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "traderjoes-organic",
      storeId: "traderjoes",
      name: "TRADER JOE'S",
      price: 5.49,
      date: "3/8/2025",
      change: -0.5,
      changePercent: -8.3,
      eggType: "ORGANIC",
    },
    {
      id: "aldi-organic",
      storeId: "aldi",
      name: "ALDI",
      price: 4.89,
      date: "3/8/2025",
      change: -0.1,
      changePercent: -2.0,
      eggType: "ORGANIC",
    },
    {
      id: "publix-organic",
      storeId: "publix",
      name: "PUBLIX",
      price: 6.29,
      date: "3/8/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
    {
      id: "safeway-organic",
      storeId: "safeway",
      name: "SAFEWAY",
      price: 6.19,
      date: "3/8/2025",
      change: -0.3,
      changePercent: -4.6,
      eggType: "ORGANIC",
    },
    {
      id: "wegmans-organic",
      storeId: "wegmans",
      name: "WEGMANS",
      price: 5.79,
      date: "3/8/2025",
      change: -0.2,
      changePercent: -3.3,
      eggType: "ORGANIC",
    },
    {
      id: "shoprite-organic",
      storeId: "shoprite",
      name: "SHOPRITE",
      price: 5.99,
      date: "3/8/2025",
      change: 0.0,
      changePercent: 0.0,
      eggType: "ORGANIC",
    },
  ]

  // USDA historical price data for graph (1 year)
  const regularHistoricalData = [
    { date: "3/8/2024", price: 2.93 },
    { date: "4/8/2024", price: 3.05 },
    { date: "5/8/2024", price: 3.12 },
    { date: "6/8/2024", price: 3.24 },
    { date: "7/8/2024", price: 3.36 },
    { date: "8/8/2024", price: 3.45 },
    { date: "9/8/2024", price: 3.58 },
    { date: "10/8/2024", price: 3.67 },
    { date: "11/8/2024", price: 3.82 },
    { date: "12/8/2024", price: 4.15 },
    { date: "1/8/2025", price: 4.43 },
    { date: "2/8/2025", price: 4.72 },
    { date: "3/8/2025", price: 4.94 },
  ]

  const organicHistoricalData = [
    { date: "3/8/2024", price: 4.98 },
    { date: "4/8/2024", price: 5.12 },
    { date: "5/8/2024", price: 5.25 },
    { date: "6/8/2024", price: 5.38 },
    { date: "7/8/2024", price: 5.52 },
    { date: "8/8/2024", price: 5.67 },
    { date: "9/8/2024", price: 5.83 },
    { date: "10/8/2024", price: 5.99 },
    { date: "11/8/2024", price: 6.15 },
    { date: "12/8/2024", price: 6.32 },
    { date: "1/8/2025", price: 6.49 },
    { date: "2/8/2025", price: 6.53 },
    { date: "3/8/2025", price: 6.38 },
  ]

  // Filter stores by egg type
  const stores = storeData.filter((store) => store.eggType === eggType)

  // Filter and sort stores
  const filteredStores = stores.filter((store) => store.name.toLowerCase().includes(searchTerm.toLowerCase()))

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

  const regularAvgPrice = regularEggs.reduce((sum, store) => sum + store.price, 0) / regularEggs.length
  const organicAvgPrice = organicEggs.reduce((sum, store) => sum + store.price, 0) / organicEggs.length

  // Get the correct historical data based on egg type
  const historicalData = eggType === "REGULAR" ? regularHistoricalData : organicHistoricalData

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>US EGG INDEX</h1>
      <h2 style={styles.subheader}>NATIONWIDE EGG PRICE TRACKER</h2>

      {/* Egg Indices Section */}
      <EggIndices regularPrice={regularAvgPrice} organicPrice={organicAvgPrice} />

      {/* Stores Section */}
      <div style={styles.section}>
        <h2 style={styles.header}>MAJOR US RETAILERS</h2>
        <div style={styles.updateInfo}>PRICES PER DOZEN EGGS</div>

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

        <div style={styles.storesContainer}>
          {sortedStores.map((store) => (
            <div key={store.id} style={styles.storeItem}>
              <div style={styles.storeName}>{store.name}</div>
              <div style={styles.storePrice}>${store.price.toFixed(2)}</div>
              <div style={styles.storeDate}>UPDATED: {store.date}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "15px",
                }}
              >
                <span
                  style={{
                    marginRight: "8px",
                    fontSize: "20px",
                    color: store.change >= 0 ? "#00ff00" : "#ff0000",
                  }}
                >
                  {store.change >= 0 ? "↑" : "↓"}
                </span>
                <span>
                  {store.change >= 0 ? "+" : ""}
                  {store.change.toFixed(2)} ({store.change >= 0 ? "+" : ""}
                  {store.changePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price History Chart */}
      <EggPriceChart historicalData={historicalData} eggType={eggType} />
    </div>
  )
}

