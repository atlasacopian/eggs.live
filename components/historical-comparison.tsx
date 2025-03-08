"use client"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type HistoricalDataPoint = {
  label: string
  date: string
  price: number | null
  change: number | null
  changePercent: number | null
}

export function HistoricalComparison() {
  const [eggType, setEggType] = useState("regular")
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/historical?eggType=${eggType}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setHistoricalData(data)
      } catch (error) {
        console.error("Error fetching historical data:", error)
        // Fallback mock data
        const basePrice = eggType === "organic" ? 5.5 : 3.5
        setHistoricalData([
          {
            label: "1 year ago",
            date: "2023-03-07T00:00:00.000Z",
            price: basePrice - 1.2,
            change: null,
            changePercent: null,
          },
          {
            label: "6 months ago",
            date: "2023-09-07T00:00:00.000Z",
            price: basePrice - 0.7,
            change: 0.5,
            changePercent: 21.7,
          },
          {
            label: "3 months ago",
            date: "2023-12-07T00:00:00.000Z",
            price: basePrice - 0.3,
            change: 0.4,
            changePercent: 14.3,
          },
          {
            label: "1 month ago",
            date: "2024-02-07T00:00:00.000Z",
            price: basePrice - 0.1,
            change: 0.2,
            changePercent: 6.3,
          },
          { label: "Today", date: "2024-03-07T00:00:00.000Z", price: basePrice, change: 0.1, changePercent: 2.9 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistoricalData()
  }, [eggType])

  if (isLoading) {
    return (
      <div className="bg-black rounded-none border border-gray-700 p-4 font-mono uppercase">
        <h2 className="text-xl font-medium mb-4">HISTORICAL COMPARISON</h2>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black rounded-none border border-gray-700 p-4 font-mono uppercase">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">HISTORICAL COMPARISON</h2>
        <div className="flex space-x-2">
          <Button
            variant={eggType === "regular" ? "default" : "outline"}
            size="sm"
            onClick={() => setEggType("regular")}
            className="text-xs"
          >
            REGULAR
          </Button>
          <Button
            variant={eggType === "organic" ? "default" : "outline"}
            size="sm"
            onClick={() => setEggType("organic")}
            className="text-xs"
          >
            ORGANIC
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {historicalData.map((point, index) => (
          <div key={index} className="flex justify-between items-center p-3 border border-gray-700">
            <div>
              <div className="font-medium">{point.label}</div>
              <div className="text-xs text-gray-400">{new Date(point.date).toLocaleDateString().toUpperCase()}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">{point.price !== null ? `$${point.price.toFixed(2)}` : "N/A"}</div>
              {point.change !== null && point.changePercent !== null && (
                <div className={cn("flex items-center text-xs", point.change >= 0 ? "text-green-500" : "text-red-500")}>
                  {point.change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {point.change >= 0 ? "+" : ""}
                  {point.change.toFixed(2)} ({point.change >= 0 ? "+" : ""}
                  {point.changePercent.toFixed(1)}%)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

