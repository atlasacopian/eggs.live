"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from "lucide-react"
import { useEggMarketData } from "@/hooks/use-egg-market-data"

export function MarketOverview() {
  const { marketData, isLoading } = useEggMarketData()

  if (isLoading) {
    return <p>Loading market data...</p>
  }

  const getChangeIcon = (change: number) => {
    if (change > 3) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
    if (change < -3) return <TrendingDown className="h-4 w-4 text-red-500" />
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Egg Market Overview</CardTitle>
        <CardDescription>Today's egg market performance across major indices</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="indices">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="indices">Market Indices</TabsTrigger>
            <TabsTrigger value="movers">Biggest Movers</TabsTrigger>
          </TabsList>
          <TabsContent value="indices" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketData.indices.map((index) => (
                <div key={index.id} className="flex flex-col p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{index.name}</span>
                    {getChangeIcon(index.changePercent)}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">${index.value.toFixed(2)}</span>
                    <span
                      className={`text-sm font-medium ${index.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {index.changePercent >= 0 ? "+" : ""}
                      {index.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    Volume: {index.volume.toLocaleString()} doz
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="movers" className="pt-4">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <h3 className="text-sm font-medium mb-2 text-green-600">Top Gainers</h3>
                <div className="space-y-2">
                  {marketData.topGainers.map((item) => (
                    <div key={item.symbol} className="flex justify-between items-center p-2 border rounded-md">
                      <div>
                        <div className="font-mono font-bold">{item.symbol}</div>
                        <div className="text-xs text-muted-foreground">{item.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${item.price.toFixed(2)}</div>
                        <div className="text-xs text-green-500">+{item.changePercent.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2 text-red-600">Top Losers</h3>
                <div className="space-y-2">
                  {marketData.topLosers.map((item) => (
                    <div key={item.symbol} className="flex justify-between items-center p-2 border rounded-md">
                      <div>
                        <div className="font-mono font-bold">{item.symbol}</div>
                        <div className="text-xs text-muted-foreground">{item.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${item.price.toFixed(2)}</div>
                        <div className="text-xs text-red-500">{item.changePercent.toFixed(2)}%</div>
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

