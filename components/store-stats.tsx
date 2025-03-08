"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEggStats } from "@/hooks/use-egg-stats"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

export function StoreStats() {
  const { stats, isLoading } = useEggStats()

  if (isLoading) {
    return <p>Loading store statistics...</p>
  }

  const getTrendIcon = (trend) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-red-500" />
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendText = (trend) => {
    if (trend === 0) return "No change"
    const direction = trend > 0 ? "up" : "down"
    return `${Math.abs(trend).toFixed(1)}% ${direction}`
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-medium mb-4">7-Day Price Trends</h3>
        <div className="space-y-4">
          {stats.map((store) => (
            <div key={store.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <h4 className="font-medium">{store.name}</h4>
                <p className="text-sm text-muted-foreground">Current: ${store.currentPrice.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(store.weeklyTrend)}
                <span
                  className={`text-sm font-medium ${
                    store.weeklyTrend > 0 ? "text-red-500" : store.weeklyTrend < 0 ? "text-green-500" : "text-gray-500"
                  }`}
                >
                  {getTrendText(store.weeklyTrend)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

