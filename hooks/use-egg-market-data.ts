"use client"

import { useState, useEffect } from "react"

export function useEggMarketData() {
  const [marketData, setMarketData] = useState({
    indices: [],
    topGainers: [],
    topLosers: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/market-data');
        // const data = await response.json();

        // For now, we'll use mock data
        const mockData = {
          indices: [
            {
              id: "egg-500",
              name: "EGG-500",
              value: 425.67,
              changePercent: 1.2,
              volume: 1250000,
            },
            {
              id: "egg-jones",
              name: "Egg Jones",
              value: 32145.89,
              changePercent: -0.5,
              volume: 980000,
            },
            {
              id: "egg-nasdaq",
              name: "EGG-NASDAQ",
              value: 14532.67,
              changePercent: 0.8,
              volume: 1450000,
            },
          ],
          topGainers: [
            {
              symbol: "ORG",
              name: "Organic Eggs",
              price: 5.89,
              changePercent: 3.7,
            },
            {
              symbol: "OMEGA",
              name: "Omega-3 Eggs",
              price: 6.15,
              changePercent: 5.5,
            },
            {
              symbol: "DUCK",
              name: "Duck Eggs",
              price: 7.89,
              changePercent: 1.9,
            },
          ],
          topLosers: [
            {
              symbol: "JMB-W",
              name: "Jumbo White",
              price: 4.25,
              changePercent: -2.7,
            },
            {
              symbol: "QUAIL",
              name: "Quail Eggs",
              price: 8.45,
              changePercent: -2.7,
            },
            {
              symbol: "LRG-B",
              name: "Large Brown",
              price: 3.78,
              changePercent: -1.3,
            },
          ],
        }

        setMarketData(mockData)
      } catch (error) {
        console.error("Error fetching market data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketData()
  }, [])

  return { marketData, isLoading }
}

