"use client"

import { useState, useEffect } from "react"
import EggChart from "./egg-chart"

interface EggPriceChartProps {
  historicalData: Array<{
    date: string
    price: number
  }>
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

  return (
    <div style={styles.section}>
      <h2 style={styles.header}>US PRICE HISTORY (1 YEAR)</h2>
      <div style={styles.subtitle}>AVERAGE PRICE PER DOZEN EGGS</div>

      <div style={styles.buttonContainer}>
        <button
          style={{
            ...styles.button,
            ...(chartType === "REGULAR" ? styles.activeButton : {}),
          }}
          onClick={() => setChartType("REGULAR")}
        >
          REGULAR
        </button>
        <button
          style={{
            ...styles.button,
            ...(chartType === "ORGANIC" ? styles.activeButton : {}),
          }}
          onClick={() => setChartType("ORGANIC")}
        >
          ORGANIC
        </button>
      </div>

      <EggChart data={historicalData} dataSource="USDA Agricultural Marketing Service" />
    </div>
  )
}

