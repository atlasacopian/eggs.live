"use client"

import { useState, useEffect } from "react"

export function useStoreData(eggType = "regular") {
  const [stores, setStores] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStoreData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/stores?eggType=${eggType}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setStores(data)
      } catch (error) {
        console.error("Error fetching store data:", error)
        // Fallback to mock data if API fails
        // Adjust prices based on egg type
        const priceMultiplier = eggType === "organic" ? 1.6 : 1

        const mockStores = [
          {
            id: "walmart",
            name: "Walmart",
            price: 3.28 * priceMultiplier,
            change: -0.12,
            changePercent: -3.5,
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "kroger",
            name: "Kroger",
            price: 3.49 * priceMultiplier,
            change: 0.05,
            changePercent: 1.4,
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "target",
            name: "Target",
            price: 3.59 * priceMultiplier,
            change: 0.1,
            changePercent: 2.9,
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "wholeFoods",
            name: "Whole Foods",
            price: 4.29 * priceMultiplier,
            change: 0.15,
            changePercent: 3.6,
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "costco",
            name: "Costco",
            price: 3.15 * priceMultiplier,
            change: -0.08,
            changePercent: -2.5,
            lastUpdated: new Date().toISOString(),
          },
        ]

        setStores(mockStores)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStoreData()
  }, [eggType])

  return { stores, isLoading }
}

