"use client"

import { useState, useEffect } from "react"
import CurrentPrice from "@/components/current-price"

interface EggPriceData {
  price: number
  timestamp: string
}

const EggPriceTracker = () => {
  const [eggPriceData, setEggPriceData] = useState<EggPriceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/prices")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setEggPriceData(data.prices || [])
      } catch (e: any) {
        console.error("Error fetching egg prices:", e)
        setError(e.message || "Failed to load egg prices")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="text-center p-4">Loading egg price data...</div>
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>
  }

  const latestPrice = eggPriceData.length > 0 ? eggPriceData[0].price : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Egg Price Tracker</h1>
      {latestPrice !== null ? (
        <CurrentPrice price={latestPrice} />
      ) : (
        <p className="text-center p-4">No egg price data available.</p>
      )}

      <h2 className="text-xl font-semibold mt-6">Price History</h2>
      {eggPriceData.length > 0 ? (
        <ul className="divide-y">
          {eggPriceData.map((data, index) => (
            <li key={index} className="py-2 flex justify-between">
              <span>{new Date(data.timestamp).toLocaleDateString()}</span>
              <span className="font-medium">${data.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center p-4">No price history available.</p>
      )}
    </div>
  )
}

export default EggPriceTracker

