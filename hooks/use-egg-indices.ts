"use client"

import { useState, useEffect } from "react"

export function useEggIndices() {
  const [indices, setIndices] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchIndices = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/indices');
        // const data = await response.json();

        // For now, we'll use mock data
        const mockIndices = [
          {
            id: "egg-500",
            name: "EGG-500",
            description: "Top 500 egg producers",
            value: 425.67,
            changePercent: 1.2,
          },
          {
            id: "egg-jones",
            name: "Egg Jones",
            description: "30 largest egg companies",
            value: 32145.89,
            changePercent: -0.5,
          },
          {
            id: "egg-nasdaq",
            name: "EGG-NASDAQ",
            description: "Tech-focused egg producers",
            value: 14532.67,
            changePercent: 0.8,
          },
          {
            id: "egg-russell",
            name: "Egg Russell 2000",
            description: "Small-cap egg producers",
            value: 1876.32,
            changePercent: -0.3,
          },
        ]

        setIndices(mockIndices)
      } catch (error) {
        console.error("Error fetching indices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchIndices()
  }, [])

  return { indices, isLoading }
}

