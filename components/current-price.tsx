"use client"

interface PriceProps {
  label: string
  price: number
  change?: number
  changePercent?: number
  size?: "small" | "medium" | "large"
}

export default function CurrentPrice({ label, price, change = 0, changePercent = 0, size = "medium" }: PriceProps) {
  // Determine font sizes based on size prop
  const priceFontSize = size === "large" ? "36px" : size === "medium" ? "32px" : "28px"
  const labelFontSize = size === "large" ? "20px" : size === "medium" ? "18px" : "16px"
  const arrowFontSize = size === "large" ? "28px" : size === "medium" ? "24px" : "20px"

  const styles = {
    priceSection: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      marginBottom: "20px",
    },
    priceLabel: {
      fontSize: labelFontSize,
      marginBottom: "5px",
    },
    price: {
      fontSize: priceFontSize,
      marginBottom: "5px",
      fontWeight: "bold",
    },
    change: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "15px",
    },
  }

  return (
    <div style={styles.priceSection}>
      <div style={styles.priceLabel}>{label}</div>
      <div style={styles.price}>${price.toFixed(2)}</div>
      {change !== undefined && changePercent !== undefined && (
        <div style={styles.change}>
          <span
            style={{
              marginRight: "8px",
              fontSize: arrowFontSize,
              color: change >= 0 ? "#00ff00" : "#ff0000",
            }}
          >
            {change >= 0 ? "↑" : "↓"}
          </span>
          <span>
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)} ({change >= 0 ? "+" : ""}
            {changePercent.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  )
}

