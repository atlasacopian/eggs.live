"use client"

import { useEffect, useState } from "react"

interface PriceData {
  averages: {
    regular: number
    organic: number
    regularCount: number
    organicCount: number
  }
  prices: any[]
}

export function CurrentPrice({ eggType = "regular" }: { eggType?: "regular" | "organic" }) {
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true)
        const response = await fetch("/api/prices")

        if (!response.ok) {
          throw new Error("Failed to fetch prices")
        }

        const data = await response.json()
        setPriceData(data)
      } catch (err) {
        console.error("Error fetching prices:", err)
        setError("Failed to load price data")
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()

    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchPrices, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  const formatPrice = (price: number) => {
    return price ? `$${price.toFixed(2)}/dozen` : "$0.00/dozen"
  }

  const getStoreCount = () => {
    if (!priceData) return 0
    return eggType === "regular" ? priceData.averages.regularCount : priceData.averages.organicCount
  }

  const getAveragePrice = () => {
    if (!priceData) return 0
    return eggType === "regular" ? priceData.averages.regular : priceData.averages.organic
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-2">Average {eggType === "organic" ? "Organic" : "Regular"} Price</h2>

      {loading ? (
        <p className="text-3xl font-bold">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <p className="text-3xl font-bold">{formatPrice(getAveragePrice())}</p>
          <p className="text-sm text-gray-500">Based on {getStoreCount()} stores</p>
        </>
      )}
    </div>
  )
}

