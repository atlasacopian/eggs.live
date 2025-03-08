"use client"

import { useState, useEffect } from "react"

export function useEggMarketNews() {
  const [news, setNews] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/market-news');
        // const data = await response.json();

        // For now, we'll use mock data
        const mockNews = [
          {
            id: 1,
            title: "Avian Flu Outbreak Impacts Egg Supply Chain",
            summary:
              "Recent avian flu cases in the Midwest have led to concerns about egg supply, with prices expected to rise in the coming weeks.",
            date: "2023-03-06T08:30:00Z",
            source: "Egg Market Daily",
            impact: "high",
          },
          {
            id: 2,
            title: "Organic Egg Demand Surges 15% in Q1",
            summary:
              "Consumer preference for organic eggs continues to grow, with sales up 15% compared to the same period last year.",
            date: "2023-03-05T14:15:00Z",
            source: "Poultry Times",
            impact: "medium",
          },
          {
            id: 3,
            title: "New Sustainability Certification for Free Range Producers",
            summary:
              "The Egg Standards Board has introduced a new sustainability certification program for free range egg producers.",
            date: "2023-03-04T10:45:00Z",
            source: "Egg Industry Journal",
            impact: "low",
          },
          {
            id: 4,
            title: "Major Retailer Announces Cage-Free Commitment",
            summary:
              "SuperMart has announced plans to source 100% cage-free eggs by 2025, affecting supply chain dynamics.",
            date: "2023-03-03T16:20:00Z",
            source: "Retail News Network",
            impact: "medium",
          },
        ]

        setNews(mockNews)
      } catch (error) {
        console.error("Error fetching market news:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [])

  return { news, isLoading }
}

