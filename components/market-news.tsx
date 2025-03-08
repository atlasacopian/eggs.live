"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEggMarketNews } from "@/hooks/use-egg-market-news"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ExternalLink } from "lucide-react"

export function MarketNews() {
  const { news, isLoading } = useEggMarketNews()

  if (isLoading) {
    return <p>Loading market news...</p>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Egg Market News</CardTitle>
        <CardDescription>Latest news affecting egg prices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-1">
                <Badge
                  variant={item.impact === "high" ? "destructive" : item.impact === "medium" ? "default" : "outline"}
                >
                  {item.impact.charAt(0).toUpperCase() + item.impact.slice(1)} Impact
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
              <h3 className="font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{item.summary}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Source: {item.source}</span>
                <a href="#" className="text-xs flex items-center text-primary hover:underline">
                  Read more <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

