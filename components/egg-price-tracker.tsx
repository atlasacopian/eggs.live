"use client"

import { useState, useEffect } from "react"
import CurrentPrice from "./current-price"

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
        const response = await fetch("/api/egg-prices") // Replace with your API endpoint
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: EggPriceData[] = await response.json()
        setEggPriceData(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div>Loading egg price data...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  const latestPrice = eggPriceData.length > 0 ? eggPriceData[eggPriceData.length - 1].price : null

  return (
    <div>
      <h1>Egg Price Tracker</h1>
      {latestPrice !== null ? <CurrentPrice price={latestPrice} /> : <p>No egg price data available.</p>}
      <h2>Price History</h2>
      <ul>
        {eggPriceData.map((data, index) => (
          <li key={index}>
            {new Date(data.timestamp).toLocaleString()}: ${data.price}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EggPriceTracker

