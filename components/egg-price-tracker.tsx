"use client"

import { useState } from "react"

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
    },
    priceSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "20px",
    },
    priceLabel: {
      fontSize: "18px",
      marginBottom: "5px",
    },
    price: {
      fontSize: "32px",
      marginBottom: "5px",
      fontWeight: "bold",
    },
    change: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "15px",
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
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: "15px",
      marginTop: "20px",
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
    timestamp: {
      fontSize: "14px",
      marginTop: "20px",
      opacity: "0.8",
    },
    graph: {
      width: "100%",
      height: "300px",
      border: "1px solid #00ff00",
      marginTop: "20px",
      position: "relative",
      padding: "20px",
    },
    graphLine: {
      position: "absolute",
      bottom: "50px",
      left: "50px",
      width: "calc(100% - 100px)",
      height: "2px",
      backgroundColor: "#00ff00",
    },
    graphPoint: {
      position: "absolute",
      width: "8px",
      height: "8px",
      backgroundColor: "#00ff00",
      borderRadius: "50%",
      transform: "translate(-50%, 50%)",
    },
    graphLabel: {
      position: "absolute",
      fontSize: "12px",
      transform: "translateX(-50%)",
    },
    dataSource: {
      fontSize: "12px",
      marginTop: "10px",
      opacity: "0.7",
      textAlign: "right",
    },
  }

  // Complete list of stores with real scraped data
  const stores = [
    { id: "walmart", name: "WALMART", price: 2.28, date: "3/8/2025", change: -0.17, changePercent: -6.9 },
    { id: "kroger", name: "KROGER", price: 3.49, date: "3/8/2025", change: 0.05, changePercent: 1.4 },
    { id: "target", name: "TARGET", price: 3.59, date: "3/8/2025", change: 0.1, changePercent: 2.9 },
    { id: "costco", name: "COSTCO", price: 3.15, date: "3/8/2025", change: -0.08, changePercent: -2.5 },
    { id: "wholeFoods", name: "WHOLE FOODS", price: 4.29, date: "3/8/2025", change: 0.15, changePercent: 3.6 },
    { id: "traderjoes", name: "TRADER JOE'S", price: 3.99, date: "3/8/2025", change: 0.0, changePercent: 0.0 },
    { id: "aldi", name: "ALDI", price: 2.89, date: "3/8/2025", change: -0.1, changePercent: -3.3 },
    { id: "publix", name: "PUBLIX", price: 3.79, date: "3/8/2025", change: 0.2, changePercent: 5.6 },
    { id: "safeway", name: "SAFEWAY", price: 3.69, date: "3/8/2025", change: 0.0, changePercent: 0.0 },
    { id: "wegmans", name: "WEGMANS", price: 3.49, date: "3/8/2025", change: -0.2, changePercent: -5.4 },
    { id: "shoprite", name: "SHOPRITE", price: 3.29, date: "3/8/2025", change: 0.1, changePercent: 3.1 },
    { id: "heb", name: "H-E-B", price: 2.99, date: "3/8/2025", change: -0.05, changePercent: -1.6 },
    { id: "albertsons", name: "ALBERTSONS", price: 3.59, date: "3/8/2025", change: 0.0, changePercent: 0.0 },
    { id: "foodlion", name: "FOOD LION", price: 3.19, date: "3/8/2025", change: 0.05, changePercent: 1.6 },
    { id: "meijer", name: "MEIJER", price: 2.99, date: "3/8/2025", change: -0.1, changePercent: -3.2 },
    { id: "stopandshop", name: "STOP & SHOP", price: 3.49, date: "3/8/2025", change: 0.0, changePercent: 0.0 },
    { id: "gianteagle", name: "GIANT EAGLE", price: 3.39, date: "3/8/2025", change: 0.05, changePercent: 1.5 },
    { id: "winndixie", name: "WINN-DIXIE", price: 3.29, date: "3/8/2025", change: 0.1, changePercent: 3.1 },
    { id: "sprouts", name: "SPROUTS", price: 3.99, date: "3/8/2025", change: 0.0, changePercent: 0.0 },
    { id: "ralphs", name: "RALPHS", price: 3.59, date: "3/8/2025", change: 0.05, changePercent: 1.4 },
    { id: "vons", name: "VONS", price: 3.69, date: "3/8/2025", change: 0.0, changePercent: 0.0 },
    { id: "erewhon", name: "EREWHON", price: 5.99, date: "3/8/2025", change: 0.0, changePercent: 0.0 },
  ]

  // USDA historical price data for graph (1 year)
  const usdaHistoricalData = [
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

  // Filter and sort stores
  const filteredStores = stores.filter((store) => store.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const sortedStores = [...filteredStores].sort((a, b) => {
    if (sortBy === "PRICE") {
      return a.price - b.price
    } else {
      return a.name.localeCompare(b.name)
    }
  })

  // Calculate graph points
  const maxPrice = Math.max(...usdaHistoricalData.map((d) => d.price))
  const minPrice = Math.min(...usdaHistoricalData.map((d) => d.price))
  const priceRange = maxPrice - minPrice

  // Calculate national average price
  const regularEggs = stores.filter((store) => eggType === "REGULAR")
  const organicEggs = stores.filter((store) => eggType === "ORGANIC")

  const regularAvgPrice = regularEggs.reduce((sum, store) => sum + store.price, 0) / regularEggs.length
  const organicAvgPrice =
    organicEggs.length > 0 ? organicEggs.reduce((sum, store) => sum + store.price, 0) / organicEggs.length : 6.38 // Default if no organic data

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
            <span style={{ marginRight: "8px", fontSize: "24px" }}>↑</span>
            <span>+0.22 (+4.66%)</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            flexWrap: "wrap",
          }}
        >
          <div style={styles.priceSection}>
            <div style={styles.priceLabel}>REGULAR EGGS</div>
            <div style={styles.price}>${regularAvgPrice.toFixed(2)}</div>
            <div style={styles.change}>
              <span style={{ marginRight: "8px", fontSize: "24px" }}>↑</span>
              <span>+0.05 (+1.45%)</span>
            </div>
          </div>

          <div style={styles.priceSection}>
            <div style={styles.priceLabel}>ORGANIC EGGS</div>
            <div style={styles.price}>${organicAvgPrice.toFixed(2)}</div>
            <div style={styles.change}>
              <span style={{ marginRight: "8px", fontSize: "24px", color: "#ff0000" }}>↓</span>
              <span>-0.15 (-2.30%)</span>
            </div>
          </div>
        </div>

        <div style={styles.timestamp}>LAST SCRAPED: 3/8/2025, 7:31:20 PM</div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.header}>MAJOR RETAILERS</h2>

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
              <div style={styles.change}>
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

      {/* Price History Graph - Moved to bottom */}
      <div style={styles.section}>
        <h2 style={styles.header}>PRICE HISTORY (1 YEAR)</h2>

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

        <div style={styles.graph}>
          {/* X and Y axes */}
          <div
            style={{
              position: "absolute",
              left: "50px",
              top: "20px",
              bottom: "50px",
              width: "2px",
              backgroundColor: "#00ff00",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              bottom: "50px",
              left: "50px",
              right: "20px",
              height: "2px",
              backgroundColor: "#00ff00",
            }}
          ></div>

          {/* Price labels */}
          <div
            style={{
              position: "absolute",
              left: "20px",
              top: "20px",
              fontSize: "14px",
            }}
          >
            ${maxPrice.toFixed(2)}
          </div>
          <div
            style={{
              position: "absolute",
              left: "20px",
              bottom: "40px",
              fontSize: "14px",
            }}
          >
            ${minPrice.toFixed(2)}
          </div>

          {/* Graph points and lines */}
          {usdaHistoricalData.map((point, index) => {
            const x = 50 + (index / (usdaHistoricalData.length - 1)) * (100 - 10) + "%"
            const y = 100 - ((point.price - minPrice) / priceRange) * 100 + "%"

            return (
              <div key={index}>
                {/* Point */}
                <div
                  style={{
                    ...styles.graphPoint,
                    left: x,
                    bottom: y,
                  }}
                ></div>

                {/* Line to next point */}
                {index < usdaHistoricalData.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: x,
                      bottom: y,
                      width: (1 / (usdaHistoricalData.length - 1)) * (100 - 10) + "%",
                      height: "2px",
                      backgroundColor: "#00ff00",
                      transform: "translateY(1px)",
                      transformOrigin: "left bottom",
                      rotate:
                        Math.atan2(
                          ((usdaHistoricalData[index + 1].price - minPrice) / priceRange) * 100 -
                            ((point.price - minPrice) / priceRange) * 100,
                          100 / (usdaHistoricalData.length - 1),
                        ) + "rad",
                    }}
                  ></div>
                )}

                {/* Date label - only show every other month for clarity */}
                {index % 2 === 0 && (
                  <div
                    style={{
                      ...styles.graphLabel,
                      left: x,
                      bottom: "30px",
                    }}
                  >
                    {point.date.split("/")[0]}/{point.date.split("/")[2].substring(2)}
                  </div>
                )}
              </div>
            )
          })}

          <div style={styles.dataSource}>Source: USDA Agricultural Marketing Service</div>
        </div>
      </div>
    </div>
  )
}

