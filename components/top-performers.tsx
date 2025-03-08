"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEggPerformance } from "@/hooks/use-egg-performance"
import { ArrowDown, ArrowUp } from "lucide-react"

export function TopPerformers() {
  const { performance, isLoading } = useEggPerformance()

  if (isLoading) {
    return <p>Loading performance data...</p>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Egg Market Performance</CardTitle>
        <CardDescription>Top performing egg types across different time periods</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="day">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>

          {Object.keys(performance).map((period) => (
            <TabsContent key={period} value={period} className="pt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Top Performers</h3>
                  <div className="space-y-2">
                    {performance[period].gainers.map((item) => (
                      <div key={item.symbol} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-full">
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{item.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${item.price.toFixed(2)}</div>
                          <div className="text-xs text-green-600">+{item.changePercent.toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Worst Performers</h3>
                  <div className="space-y-2">
                    {performance[period].losers.map((item) => (
                      <div key={item.symbol} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-2 rounded-full">
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{item.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${item.price.toFixed(2)}</div>
                          <div className="text-xs text-red-600">{item.changePercent.toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

