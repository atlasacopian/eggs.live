"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEggPrices } from "@/hooks/use-egg-prices"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PriceComparison() {
  const [eggType, setEggType] = useState("large-white")
  const { prices, isLoading } = useEggPrices()

  const eggTypes = [
    { id: "large-white", label: "Large White" },
    { id: "large-brown", label: "Large Brown" },
    { id: "organic", label: "Organic" },
    { id: "free-range", label: "Free Range" },
  ]

  const formatData = (data) => {
    return data
      .map((item) => ({
        store: item.storeName,
        price: item.prices[eggType],
        color: getStoreColor(item.storeId),
      }))
      .sort((a, b) => a.price - b.price)
  }

  const getStoreColor = (storeId) => {
    const colors = {
      kroger: "#0073e6",
      wholeFoods: "#00674b",
      walmart: "#0071dc",
      target: "#cc0000",
    }
    return colors[storeId] || "#888888"
  }

  if (isLoading) {
    return <p>Loading price data...</p>
  }

  const chartData = formatData(prices)
  const lowestPrice = chartData.length > 0 ? chartData[0] : null

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Egg Price Comparison</CardTitle>
            <CardDescription>Compare egg prices across different stores</CardDescription>
          </div>
          <Tabs defaultValue={eggType} onValueChange={setEggType} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4">
              {eggTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {lowestPrice && (
          <div className="mb-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mb-2">
              Best Deal
            </Badge>
            <p className="font-medium">
              {lowestPrice.store} has the lowest price at ${lowestPrice.price.toFixed(2)} per dozen
            </p>
          </div>
        )}
        <div className="h-[400px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(2)}`} />
              <YAxis type="category" dataKey="store" width={100} />
              <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, "Price"]}
                labelFormatter={(value) => `${value}`}
              />
              <Legend />
              <Bar
                dataKey="price"
                name="Price per dozen"
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
                barSize={30}
                label={{ position: "right", formatter: (value) => `$${value.toFixed(2)}` }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

