"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEggMarketStats } from "@/hooks/use-egg-market-stats"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MarketStats() {
  const { stats, loading, error } = useEggMarketStats()

  if (loading) {
    return <p>Loading market statistics...</p>
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>
  }

  if (!stats) {
    return <p>No market statistics available</p>
  }

  const chainData = stats.chainAverages.map((chain) => ({
    name: chain.chain,
    average: Number.parseFloat(chain.average.toFixed(2)),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Egg Market Statistics</CardTitle>
        <CardDescription>
          National average: ${stats.nationalAverage.toFixed(2)} (based on {stats.priceCount} prices)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chainData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, "dataMax + 1"]} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [`$${value}`, "Average Price"]} />
                  <Legend />
                  <Bar dataKey="average" fill="#f59e0b" name="Average Price" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="table" className="pt-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 border-b bg-muted/50 p-2 text-sm font-medium">
                <div className="col-span-6">Chain</div>
                <div className="col-span-3 text-right">Average</div>
                <div className="col-span-3 text-right">Count</div>
              </div>
              <div className="divide-y">
                {stats.chainAverages.map((chain) => (
                  <div key={chain.chain} className="grid grid-cols-12 p-2 text-sm">
                    <div className="col-span-6 font-medium">{chain.chain}</div>
                    <div className="col-span-3 text-right">${chain.average.toFixed(2)}</div>
                    <div className="col-span-3 text-right">{chain.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

