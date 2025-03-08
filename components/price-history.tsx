"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEggPriceHistory } from "@/hooks/use-egg-price-history"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

export function PriceHistory() {
  const [selectedStore, setSelectedStore] = useState("kroger")
  const { history, isLoading } = useEggPriceHistory(selectedStore)

  const stores = [
    { id: "kroger", name: "Kroger" },
    { id: "wholeFoods", name: "Whole Foods" },
    { id: "walmart", name: "Walmart" },
  ]

  const getStoreColor = (storeId) => {
    const colors = {
      kroger: "#0073e6",
      wholeFoods: "#00674b",
      walmart: "#0071dc",
    }
    return colors[storeId] || "#888888"
  }

  if (isLoading) {
    return <p>Loading price history...</p>
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">30-Day Price Trend</h3>
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                domain={["dataMin - 0.2", "dataMax + 0.2"]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, "Price"]}
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                }
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={getStoreColor(selectedStore)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

