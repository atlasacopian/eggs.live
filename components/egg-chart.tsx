"use client"

import { useEffect, useRef } from "react"

interface DataPoint {
  date: string
  price: number
}

interface EggChartProps {
  data: DataPoint[]
  dataSource?: string
}

export default function EggChart({ data, dataSource }: EggChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Find min and max values
    const prices = data.map((d) => d.price)
    const minPrice = Math.min(...prices) * 0.9 // Add some padding
    const maxPrice = Math.max(...prices) * 1.1

    // Draw background
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "rgba(0, 255, 0, 0.2)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    const numHorizontalLines = 5
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = padding + (chartHeight * i) / numHorizontalLines
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()

      // Price labels
      const price = maxPrice - ((maxPrice - minPrice) * i) / numHorizontalLines
      ctx.fillStyle = "rgba(0, 255, 0, 0.7)"
      ctx.font = "12px monospace"
      ctx.textAlign = "right"
      ctx.fillText(`$${price.toFixed(2)}`, padding - 10, y + 4)
    }

    // Vertical grid lines and date labels
    const numVerticalLines = Math.min(data.length, 12) // One line per month
    for (let i = 0; i <= numVerticalLines; i++) {
      const x = padding + (chartWidth * i) / numVerticalLines
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, padding + chartHeight)
      ctx.stroke()

      // Date labels
      if (i < numVerticalLines) {
        const dataIndex = Math.floor((data.length * i) / numVerticalLines)
        const date = data[dataIndex].date
        ctx.fillStyle = "rgba(0, 255, 0, 0.7)"
        ctx.font = "12px monospace"
        ctx.textAlign = "center"
        ctx.fillText(date, x, padding + chartHeight + 20)
      }
    }

    // Draw line chart
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((point, i) => {
      const x = padding + (chartWidth * i) / (data.length - 1)
      const y = padding + chartHeight - ((point.price - minPrice) / (maxPrice - minPrice)) * chartHeight
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw data points
    data.forEach((point, i) => {
      const x = padding + (chartWidth * i) / (data.length - 1)
      const y = padding + chartHeight - ((point.price - minPrice) / (maxPrice - minPrice)) * chartHeight

      ctx.fillStyle = "#00ff00"
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw data source
    if (dataSource) {
      ctx.fillStyle = "rgba(0, 255, 0, 0.5)"
      ctx.font = "12px monospace"
      ctx.textAlign = "right"
      ctx.fillText(`Source: ${dataSource}`, width - padding, height - 10)
    }
  }, [data, dataSource])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      style={{
        maxWidth: "100%",
        height: "auto",
        display: "block",
        margin: "0 auto",
      }}
    />
  )
}

