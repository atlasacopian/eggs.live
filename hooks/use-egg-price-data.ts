"use client"

import { useState, useEffect } from "react"

export function useEggPriceData(timeframe = "1M", eggType = "regular") {
  const [priceData, setPriceData] = useState([])
  const [currentPrice, setCurrentPrice] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPriceData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/prices?timeframe=${timeframe}&eggType=${eggType}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        setPriceData(data.prices || [])
        setCurrentPrice(data.currentPrice)
        setLastUpdated(data.lastUpdated)
      } catch (error) {
        console.error("Error fetching price data:", error)
        // Fallback to mock data if API fails
        const mockData = generateMockPriceData(90, eggType)
        setPriceData(mockData)
        setCurrentPrice(mockData[mockData.length - 1]?.price || (eggType === "organic" ? 5.5 : 3.5))
        setLastUpdated(new Date().toISOString())
      } finally {
        setIsLoading(false)
      }
    }

    fetchPriceData()
  }, [timeframe, eggType])

  return { priceData, currentPrice, lastUpdated, isLoading }
}

// Update the mock data generator to account for egg type
function generateMockPriceData(days, eggType = "regular") {
  const data = []
  const today = new Date()

  // Base price is higher for organic eggs
  let price = eggType === "organic" ? 5.5 : 3.5

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - i - 1))

    const randomChange = (Math.random() - 0.5) * 0.15
    const trendFactor = Math.sin(i / 10) * 0.1
    const spikeFactor = i === 30 ? 0.5 : i === 31 ? 0.3 : 0

    // Organic eggs have a higher price range
    const minPrice = eggType === "organic" ? 4.5 : 2.5
    const maxPrice = eggType === "organic" ? 7.5 : 5.5

    price = Math.max(minPrice, Math.min(maxPrice, price + randomChange + trendFactor + spikeFactor))

    data.push({
      date: date.toISOString(),
      price: Number.parseFloat(price.toFixed(2)),
    })
  }

  return data
}

