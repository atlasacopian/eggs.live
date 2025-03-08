"use client"

import { useState, useEffect } from "react"

export function useEggMarketStats() {
  const [stats, setStats] = useState({
    totalVolume: 0,
    volumeChange: 0,
    marketCap: 0,
    marketCapChange: 0,
    activeTraders: 0,
    tradesCount: 0,
    volumeByType: [],
    mostActive: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/market-stats');
        // const data = await response.json();

        // For now, we'll use mock data
        const mockStats = {
          totalVolume: 3250,
          volumeChange: 5.2,
          marketCap: 845.6,
          marketCapChange: 1.8,
          activeTraders: 12458,
          tradesCount: 45789,
          volumeByType: [
            { name: "Large White", volume: 980 },
            { name: "Large Brown", volume: 750 },
            { name: "Organic", volume: 620 },
            { name: "Free Range", volume: 540 },
            { name: "Specialty", volume: 360 },
          ],
          mostActive: [
            {
              symbol: "LRG-W",
              name: "Large White",
              trades: 15243,
              volume: 980,
            },
            {
              symbol: "ORG",
              name: "Organic",
              trades: 12567,
              volume: 620,
            },
            {
              symbol: "OMEGA",
              name: "Omega-3",
              trades: 9876,
              volume: 320,
            },
          ],
        }

        setStats(mockStats)
      } catch (error) {
        console.error("Error fetching market stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, isLoading }
}

