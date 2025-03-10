"use client"

interface DataPoint {
  date: string
  price: number
}

interface EggChartProps {
  data: DataPoint[]
  title?: string
  dataSource?: string
}

export default function EggChart({ data, title, dataSource }: EggChartProps) {
  const maxPrice = Math.max(...data.map((d) => d.price))
  const minPrice = Math.min(...data.map((d) => d.price))
  const priceRange = maxPrice - minPrice

  const styles = {
    graph: {
      width: "100%",
      height: "300px",
      border: "1px solid #00ff00",
      marginTop: "20px",
      position: "relative" as const,
      padding: "20px",
    },
    graphPoint: {
      position: "absolute" as const,
      width: "8px",
      height: "8px",
      backgroundColor: "#00ff00",
      borderRadius: "50%",
      transform: "translate(-50%, 50%)",
    },
    graphLabel: {
      position: "absolute" as const,
      fontSize: "12px",
      transform: "translateX(-50%)",
    },
    dataSource: {
      fontSize: "12px",
      marginTop: "10px",
      opacity: "0.7",
      textAlign: "right" as const,
    },
  }

  // Reverse the data array to show increasing trend
  const reversedData = [...data].reverse()

  return (
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
      {reversedData.map((point, index) => {
        const x = 50 + (index / (data.length - 1)) * (100 - 10) + "%"
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
            {index < data.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  bottom: y,
                  width: (1 / (data.length - 1)) * (100 - 10) + "%",
                  height: "2px",
                  backgroundColor: "#00ff00",
                  transform: "translateY(1px)",
                  transformOrigin: "left bottom",
                  rotate:
                    Math.atan2(
                      ((reversedData[index + 1].price - minPrice) / priceRange) * 100 -
                        ((point.price - minPrice) / priceRange) * 100,
                      100 / (data.length - 1),
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

      {dataSource && <div style={styles.dataSource}>Source: {dataSource}</div>}
    </div>
  )
}

