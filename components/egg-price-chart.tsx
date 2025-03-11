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
    return <div className="flex justify-center items-center h-48 text-gray-500">Loading price history...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-48 text-red-500">{error}</div>
  }

  if (priceData.length === 0) {
    return <div className="flex justify-center items-center h-48 text-gray-500">No historical price data available</div>
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Price</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Stores</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {priceData.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3">{new Date(item.date).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right font-mono">${item.price.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{item.storeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

