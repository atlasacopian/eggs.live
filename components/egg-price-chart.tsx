"use client"

import { useEffect, useState } from "react"

interface PriceData {
  date: string
  price: number
  storeCount: number
}

interface EggPriceChartProps {
  eggType: string
}

export function EggPriceChart({ eggType }: EggPriceChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistoricalPrices() {
      try {
        setLoading(true)
        const response = await fetch(`/api/historical-prices?eggType=${eggType}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch historical prices")
        }

        setPriceData(data.prices || [])
        setError(null)
      } catch (err) {
        console.error("Error fetching historical prices:", err)
        setError("Failed to load historical price data")
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalPrices()
  }, [eggType])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading price history...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>
  }

  if (priceData.length === 0) {
    return <div className="flex justify-center items-center h-64">No historical price data available</div>
  }

  // For simplicity, we'll just show the data as a table
  // In a real app, you'd want to use a charting library like Chart.js or Recharts
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Date</th>
            <th className="text-right py-2">Price</th>
            <th className="text-right py-2">Stores</th>
          </tr>
        </thead>
        <tbody>
          {priceData.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="py-2">{new Date(item.date).toLocaleDateString()}</td>
              <td className="text-right py-2">${item.price.toFixed(2)}</td>
              <td className="text-right py-2">{item.storeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

