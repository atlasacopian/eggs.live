"use client"

import { useEggPriceData } from "@/hooks/use-egg-price-data"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function CurrentPrice() {
  const {
    priceData: regularPriceData,
    currentPrice: regularPrice,
    isLoading: regularLoading,
  } = useEggPriceData("1M", "regular")
  const {
    priceData: organicPriceData,
    currentPrice: organicPrice,
    isLoading: organicLoading,
  } = useEggPriceData("1M", "organic")

  if (regularLoading || organicLoading || !regularPriceData.length || !organicPriceData.length) {
    return <div className="animate-pulse bg-black border border-gray-700 p-4 w-[180px] h-[120px]"></div>
  }

  // Get previous prices for comparison
  const previousRegularPrice =
    regularPriceData.length > 1 ? regularPriceData[regularPriceData.length - 2]?.price : regularPrice
  const regularChange = regularPrice - previousRegularPrice
  const regularChangePercent = (regularChange / previousRegularPrice) * 100
  const isRegularPositive = regularChange >= 0

  const previousOrganicPrice =
    organicPriceData.length > 1 ? organicPriceData[organicPriceData.length - 2]?.price : organicPrice
  const organicChange = organicPrice - previousOrganicPrice
  const organicChangePercent = (organicChange / previousOrganicPrice) * 100
  const isOrganicPositive = organicChange >= 0

  return (
    <div className="bg-black border border-gray-700 p-4 font-mono uppercase">
      <div className="text-sm text-gray-400 mb-1">NATIONAL AVG PRICE</div>

      {/* Regular eggs */}
      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-3xl font-bold text-white">${regularPrice.toFixed(2)}</div>
        <div
          className={cn("flex items-center text-sm font-medium", isRegularPositive ? "text-green-500" : "text-red-500")}
        >
          {isRegularPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
          {isRegularPositive ? "+" : ""}
          {regularChange.toFixed(2)} ({isRegularPositive ? "+" : ""}
          {regularChangePercent.toFixed(2)}%)
        </div>
      </div>
      <div className="text-xs text-gray-400">REGULAR EGGS</div>

      {/* Organic eggs */}
      <div className="flex items-baseline gap-2 mt-3 mb-2">
        <div className="text-3xl font-bold text-white">${organicPrice.toFixed(2)}</div>
        <div
          className={cn("flex items-center text-sm font-medium", isOrganicPositive ? "text-green-500" : "text-red-500")}
        >
          {isOrganicPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
          {isOrganicPositive ? "+" : ""}
          {organicChange.toFixed(2)} ({isOrganicPositive ? "+" : ""}
          {organicChangePercent.toFixed(2)}%)
        </div>
      </div>
      <div className="text-xs text-gray-400">ORGANIC EGGS</div>
    </div>
  )
}

