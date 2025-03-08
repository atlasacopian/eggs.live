"use client"

import { useEggPriceData } from "@/hooks/use-egg-price-data"

export function LastUpdated() {
  const { lastUpdated, isLoading } = useEggPriceData()

  if (isLoading) {
    return <div className="text-xs text-gray-500 animate-pulse">LOADING...</div>
  }

  return (
    <div className="text-xs text-gray-500">LAST SCRAPED: {new Date(lastUpdated).toLocaleString().toUpperCase()}</div>
  )
}

