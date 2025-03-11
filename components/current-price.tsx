"use client"

interface CurrentPriceProps {
  label: string
  price: number
  change: number
  changePercent: number
  size?: "small" | "large"
}

export default function CurrentPrice({ label, price, change, changePercent, size = "small" }: CurrentPriceProps) {
  const styles = {
    container: {
      border: "1px solid #00ff00",
      padding: size === "large" ? "30px 20px" : "15px",
      borderRadius: "4px",
      backgroundColor: "rgba(0, 255, 0, 0.05)",
      boxShadow: "0 0 10px rgba(0, 255, 0, 0.1)",
      transition: "all 0.3s ease",
    },
    label: {
      fontSize: size === "large" ? "18px" : "14px",
      marginBottom: "10px",
      opacity: "0.9",
    },
    price: {
      fontSize: size === "large" ? "48px" : "32px",
      marginBottom: "10px",
      textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
    },
    change: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size === "large" ? "18px" : "14px",
    },
    arrow: {
      marginRight: "8px",
      fontSize: size === "large" ? "24px" : "18px",
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.label}>{label}</div>
      <div style={styles.price}>${price.toFixed(2)}</div>
      <div style={styles.change}>
        <span
          style={{
            ...styles.arrow,
            color: change >= 0 ? "#00ff00" : "#ff0000",
          }}
        >
          {change >= 0 ? "↑" : "↓"}
        </span>
        <span
          style={{
            color: change >= 0 ? "#00ff00" : "#ff0000",
          }}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)} ({change >= 0 ? "+" : ""}
          {changePercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

