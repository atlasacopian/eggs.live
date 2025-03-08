"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEggMarketStats } from "@/hooks/use-egg-market-stats"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MarketStats() {
  const { stats, isLoading } = useEggMarketStats()

  if (isLoading) {
    return <p>Loading market statistics...</p>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Market Statistics</CardTitle>
        <CardDescription>Trading volume and market activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="volume">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="volume" className="pt-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.volumeByType} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value}k doz`} />
                  <Tooltip formatter={(value) => [`${value}k dozen`, "Volume"]} />
                  <Legend />
                  <Bar dataKey="volume" fill="#8884d8" name="Trading Volume" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-md">
                <div className="text-xs text-muted-foreground">Total Volume</div>
                <div className="text-xl font-bold">{stats.totalVolume.toLocaleString()}k doz</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.volumeChange >= 0 ? "+" : ""}
                  {stats.volumeChange}% from yesterday
                </div>
              </div>
              <div className="p-3 border rounded-md">
                <div className="text-xs text-muted-foreground">Market Cap</div>
                <div className="text-xl font-bold">${stats.marketCap.toLocaleString()}M</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats.marketCapChange >= 0 ? "+" : ""}
                  {stats.marketCapChange}% from yesterday
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="pt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-md">
                  <div className="text-xs text-muted-foreground">Active Traders</div>
                  <div className="text-xl font-bold">{stats.activeTraders.toLocaleString()}</div>
                </div>
                <div className="p-3 border rounded-md">
                  <div className="text-xs text-muted-foreground">Trades Today</div>
                  <div className="text-xl font-bold">{stats.tradesCount.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Most Active Egg Types</h3>
                <div className="space-y-2">
                  {stats.mostActive.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.trades.toLocaleString()} trades</div>
                        <div className="text-xs text-muted-foreground">{item.volume.toLocaleString()}k doz</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

