"use client"

import { useState, useEffect } from "react"
import EggChart from "./egg-chart"

interface DataPoint {
  date: string
  price: number
}

interface EggPriceChartProps {
  historicalData: DataPoint[]
  eggType: string
}

export default function EggPriceChart({ historicalData, eggType }: EggPriceChartProps) {
  const [chartType, setChartType] = useState(eggType)

  // Update chart type when eggType prop changes
  useEffect(() => {
    setChartType(eggType)
  }, [eggType])

  const styles = {
    section: {
      marginBottom: "40px",
    },
    header: {
      fontSize: "36px",
      marginBottom: "15px",
      fontWeight: "normal" as const,
      textShadow: "0 0 5px rgba(0, 255, 0, 0.5)",
    },
    subtitle: {
      fontSize: "16px",
      marginBottom: "20px",
      opacity: "0.8",
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap" as const,
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
  }

  const displayType = chartType.charAt(0).toUpperCase() + chartType.slice(1)

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>US PRICE HISTORY (1 YEAR)</h2>
      <div style={styles.subtitle}>AVERAGE PRICE PER DOZEN EGGS</div>

      <div style={styles.buttonContainer}>
        <button
          style={{
            ...styles.button,
            ...(chartType === "regular" ? styles.activeButton : {}),
          }}
          onClick={() => setChartType("regular")}
        >
          REGULAR
        </button>
        <button
          style={{
            ...styles.button,
            ...(chartType === "organic" ? styles.activeButton : {}),
          }}
          onClick={() => setChartType("organic")}
        >
          ORGANIC
        </button>
      </div>

      {historicalData.length > 0 ? (
        <EggChart data={historicalData} dataSource="USDA Agricultural Marketing Service" />
      ) : (
        <div style={{ fontSize: "18px", margin: "40px 0", color: "#00ff00" }}>
          NO HISTORICAL DATA AVAILABLE FOR {displayType.toUpperCase()} EGGS
        </div>
      )}
    </div>
  )
}

