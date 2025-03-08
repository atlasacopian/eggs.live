"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function useEggStats() {
  const [stats, setStats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const zipCode = searchParams.get("zipCode") || "10001"

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/stats?zipCode=${zipCode}`);
        // const data = await response.json();

        // For now, we'll use mock data
        const mockData = [
          {
            id: "kroger",
            name: "Kroger",
            currentPrice: 3.49,
            weeklyTrend: 2.1, // percentage
          },
          {
            id: "wholeFoods",
            name: "Whole Foods",
            currentPrice: 3.99,
            weeklyTrend: 0, // no change
          },
          {
            id: "walmart",
            name: "Walmart",
            currentPrice: 2.98,
            weeklyTrend: -1.5, // percentage decrease
          },
        ]

        // Add some variation based on zip code
        const zipSeed = Number.parseInt(zipCode.substring(0, 2)) / 100
        const variedData = mockData.map((store) => {
          const priceVariation = Math.sin(Number.parseInt(zipCode)) * 0.2 + zipSeed
          const trendVariation = Math.cos(Number.parseInt(zipCode)) * 1.5

          return {
            ...store,
            currentPrice: Number.parseFloat((store.currentPrice + priceVariation).toFixed(2)),
            weeklyTrend: Number.parseFloat((store.weeklyTrend + trendVariation).toFixed(1)),
          }
        })

        setStats(variedData)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [zipCode])

  return { stats, isLoading }
}

