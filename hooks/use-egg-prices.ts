"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function useEggPrices() {
  const [prices, setPrices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const zipCode = searchParams.get("zipCode") || "10001"

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/prices?zipCode=${zipCode}`);
        // const data = await response.json();

        // For now, we'll use mock data
        const mockData = [
          {
            storeId: "kroger",
            storeName: "Kroger",
            zipCode,
            prices: {
              "large-white": 3.49,
              "large-brown": 3.79,
              organic: 5.99,
              "free-range": 5.49,
            },
            lastUpdated: new Date().toISOString(),
          },
          {
            storeId: "wholeFoods",
            storeName: "Whole Foods",
            zipCode,
            prices: {
              "large-white": 3.99,
              "large-brown": 4.29,
              organic: 6.49,
              "free-range": 5.99,
            },
            lastUpdated: new Date().toISOString(),
          },
          {
            storeId: "walmart",
            storeName: "Walmart",
            zipCode,
            prices: {
              "large-white": 2.98,
              "large-brown": 3.48,
              organic: 5.48,
              "free-range": 4.98,
            },
            lastUpdated: new Date().toISOString(),
          },
          {
            storeId: "target",
            storeName: "Target",
            zipCode,
            prices: {
              "large-white": 3.29,
              "large-brown": 3.69,
              organic: 5.79,
              "free-range": 5.29,
            },
            lastUpdated: new Date().toISOString(),
          },
        ]

        // Add some random variation based on zip code
        const zipSeed = Number.parseInt(zipCode.substring(0, 2)) / 100
        const variedData = mockData.map((store) => {
          const variation = Math.sin(Number.parseInt(zipCode)) * 0.2 + zipSeed
          const newPrices = {}

          Object.keys(store.prices).forEach((type) => {
            newPrices[type] = Number.parseFloat((store.prices[type] + variation).toFixed(2))
          })

          return {
            ...store,
            prices: newPrices,
          }
        })

        setPrices(variedData)
      } catch (error) {
        console.error("Error fetching prices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrices()
  }, [zipCode])

  return { prices, isLoading }
}

