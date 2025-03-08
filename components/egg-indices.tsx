"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEggIndices } from "@/hooks/use-egg-indices"
import { ArrowDown, ArrowUp } from "lucide-react"

export function EggIndices() {
  const { indices, isLoading } = useEggIndices()

  if (isLoading) {
    return <p>Loading indices data...</p>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Egg Indices</CardTitle>
        <CardDescription>Major egg market indices and their performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {indices.map((index) => (
            <div key={index.id} className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <div className="font-medium">{index.name}</div>
                <div className="text-xs text-muted-foreground">{index.description}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">${index.value.toFixed(2)}</div>
                <div
                  className={`text-xs flex items-center justify-end ${index.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {index.changePercent >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {index.changePercent >= 0 ? "+" : ""}
                  {index.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

