"use client"

import { useState, useEffect } from "react"

export function useEggPerformance() {
  const [performance, setPerformance] = useState({
    day: { gainers: [], losers: [] },
    week: { gainers: [], losers: [] },
    month: { gainers: [], losers: [] },
    year: { gainers: [], losers: [] },
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPerformance = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/performance');
        // const data = await response.json();

        // For now, we'll use mock data
        const eggTypes = [
          { symbol: "LRG-W", name: "Large White" },
          { symbol: "LRG-B", name: "Large Brown" },
          { symbol: "ORG", name: "Organic" },
          { symbol: "FR", name: "Free Range" },
          { symbol: "JMB-W", name: "Jumbo White" },
          { symbol: "OMEGA", name: "Omega-3" },
          { symbol: "DUCK", name: "Duck Eggs" },
          { symbol: "QUAIL", name: "Quail Eggs" },
        ]

        const mockData = {
          day: generatePerformanceData(eggTypes, 5),
          week: generatePerformanceData(eggTypes, 10),
          month: generatePerformanceData(eggTypes, 15),
          year: generatePerformanceData(eggTypes, 25),
        }

        setPerformance(mockData)
      } catch (error) {
        console.error("Error fetching performance data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPerformance()
  }, [])

  return { performance, isLoading }
}

function generatePerformanceData(eggTypes, maxChange) {
  // Base prices for different egg types
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

  // Generate random performance data
  const performanceData = eggTypes.map((type) => {
    const changePercent = (Math.random() * 2 - 1) * maxChange // Random change between -maxChange and +maxChange
    const basePrice = basePrices[type.symbol] || 4.0
    const price = basePrice * (1 + changePercent / 100)

    return {
      ...type,
      price: Number.parseFloat(price.toFixed(2)),
      changePercent: Number.parseFloat(changePercent.toFixed(2)),
    }
  })

  // Sort by performance
  const gainers = performanceData
    .filter((item) => item.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3)

  const losers = performanceData
    .filter((item) => item.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3)

  return { gainers, losers }
}

