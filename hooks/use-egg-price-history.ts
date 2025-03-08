"use client"

import { useState, useEffect } from "react"

export function useEggPriceHistory(eggType: string, timeRange: string) {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/price-history?eggType=${eggType}&timeRange=${timeRange}`);
        // const data = await response.json();

        // For now, we'll use mock data
        const dataPoints = getDataPointsForTimeRange(timeRange)
        const mockData = generateMockPriceData(eggType, timeRange, dataPoints)

        setHistory(mockData)
      } catch (error) {
        console.error("Error fetching price history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [eggType, timeRange])

  return { history, isLoading }
}

function getDataPointsForTimeRange(timeRange: string): number {
  switch (timeRange) {
    case "1D":
      return 24 // Hourly for a day
    case "1W":
      return 7 // Daily for a week
    case "1M":
      return 30 // Daily for a month
    case "3M":
      return 90 // Daily for 3 months
    case "1Y":
      return 52 // Weekly for a year
    case "5Y":
      return 60 // Monthly for 5 years
    default:
      return 30
  }
}

function generateMockPriceData(eggType: string, timeRange: string, dataPoints: number) {
  // Base price for different egg types
  const basePrices = {
    "LRG-W": 3.42,
    "LRG-B": 3.78,
    ORG: 5.89,
    FR: 5.12,
    "JMB-W": 4.25,
    OMEGA: 6.15,
    DUCK: 7.89,
    QUAIL: 8.45,
  }

  const basePrice = basePrices[eggType] || 3.5
  const volatility = 0.05 // 5% volatility

  const now = new Date()
  const data = []

  // Generate data points based on time range
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(now)

    // Adjust date based on time range
    if (timeRange === "1D") {
      date.setHours(now.getHours() - (dataPoints - i - 1))
    } else if (timeRange === "1W") {
      date.setDate(now.getDate() - (dataPoints - i - 1))
    } else if (timeRange === "1M") {
      date.setDate(now.getDate() - (dataPoints - i - 1))
    } else if (timeRange === "3M") {
      date.setDate(now.getDate() - (dataPoints - i - 1))
    } else if (timeRange === "1Y") {
      date.setDate(now.getDate() - (dataPoints - i - 1) * 7)
    } else if (timeRange === "5Y") {
      date.setMonth(now.getMonth() - (dataPoints - i - 1))
    }

    // Generate random price movements
    const randomFactor = (Math.random() - 0.5) * 2 * volatility
    const trendFactor = (i / dataPoints) * 0.1 // Slight upward trend

    // Calculate OHLC values
    const dayVolatility = volatility * 0.5
    const open = basePrice * (1 + randomFactor + trendFactor)
    const high = open * (1 + Math.random() * dayVolatility)
    const low = open * (1 - Math.random() * dayVolatility)
    const close = (open + high + low) / 3 + (Math.random() - 0.5) * dayVolatility * basePrice

    // Generate random volume
    const volume = Math.floor(Math.random() * 50) + 10 // 10-60k dozen

    data.push({
      date: date.toISOString(),
      open: Number.parseFloat(open.toFixed(2)),
      high: Number.parseFloat(high.toFixed(2)),
      low: Number.parseFloat(low.toFixed(2)),
      close: Number.parseFloat(close.toFixed(2)),
      volume,
    })
  }

  return data
}

