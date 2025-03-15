"use client"

import { useState, useEffect } from "react"

interface MarketStats {
  nationalAverage: number
  chainAverages: Array<{
    chain: string
    average: number
    count: number
  }>
  priceCount: number
  lastUpdated: string
}

interface StoreData {
  id: number
  name: string
  priceCount: number
  averagePrice: number
}

export function useEggMarketStats(eggType: "regular" | "organic" = "regular") {
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const [statsResponse, storesResponse] = await Promise.all([
          fetch(`/api/prices?eggType=${eggType}`),
          fetch("/api/stores"),
        ])

        if (!statsResponse.ok || !storesResponse.ok) {
          throw new Error("Failed to fetch market data")
        }

        const statsData = await statsResponse.json()
        const storesData = await storesResponse.json()

        setStats({
          nationalAverage: statsData.nationalAverage || 0,
          chainAverages: statsData.chainAverages || [],
          priceCount: statsData.priceCount || 0,
          lastUpdated: new Date().toISOString(),
        })

        // Transform store data if needed
        const transformedStores =
          storesData.stores?.map((store) => ({
            id: store.id,
            name: store.name,
            priceCount: store.locationCount || 0,
            averagePrice: 0, // This would need to be calculated from the actual data
          })) || []

        setStores(transformedStores)
      } catch (err) {
        console.error("Error fetching market stats:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [eggType])

  return { stats, stores, loading, error }
}

