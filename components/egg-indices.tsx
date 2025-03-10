"use client"

import CurrentPrice from "./current-price"

interface EggIndicesProps {
  regularPrice: number
  organicPrice: number
}

export default function EggIndices({ regularPrice, organicPrice }: EggIndicesProps) {
  const styles = {
    section: {
      marginBottom: "40px",
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto 40px auto",
    },
    pricesContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "20px",
      margin: "0 auto",
      maxWidth: "800px",
    },
    subtitle: {
      fontSize: "16px",
      marginBottom: "20px",
      opacity: "0.8",
    },
  }

  return (
    <div style={styles.section}>
      <div style={styles.subtitle}>AVERAGE US PRICES PER DOZEN EGGS</div>
      <div style={styles.pricesContainer}>
        <CurrentPrice label="REGULAR EGGS" price={regularPrice} change={0.05} changePercent={1.45} size="large" />

        <CurrentPrice label="ORGANIC EGGS" price={organicPrice} change={-0.15} changePercent={-2.3} size="large" />
      </div>
    </div>
  )
}

