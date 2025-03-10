"use client"

import { useState } from "react"
import EggChart from "./egg-chart"

interface EggPriceChartProps {
  historicalData: Array<{
    date: string
    price: number
  }>
}

export default function EggPriceChart({ historicalData }: EggPriceChartProps) {
  const [eggType, setEggType] = useState("REGULAR")

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

      <EggChart data={historicalData} dataSource="USDA Agricultural Marketing Service" />
    </div>
  )
}

