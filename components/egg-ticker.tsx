"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

type TickerItem = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export function EggTicker() {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([])

  useEffect(() => {
    // In a real app, this would be fetched from an API
    const mockTickerItems: TickerItem[] = [
      { symbol: "LRG-W", name: "Large White", price: 3.42, change: 0.08, changePercent: 2.4 },
      { symbol: "LRG-B", name: "Large Brown", price: 3.78, change: -0.05, changePercent: -1.3 },
      { symbol: "ORG", name: "Organic", price: 5.89, change: 0.21, changePercent: 3.7 },
      { symbol: "FR", name: "Free Range", price: 5.12, change: 0.03, changePercent: 0.6 },
      { symbol: "JMB-W", name: "Jumbo White", price: 4.25, change: -0.12, changePercent: -2.7 },
      { symbol: "OMEGA", name: "Omega-3", price: 6.15, change: 0.32, changePercent: 5.5 },
      { symbol: "DUCK", name: "Duck Eggs", price: 7.89, change: 0.15, changePercent: 1.9 },
      { symbol: "QUAIL", name: "Quail Eggs", price: 8.45, change: -0.23, changePercent: -2.7 },
    ]

    setTickerItems(mockTickerItems)

    // Simulate price changes every few seconds
    const interval = setInterval(() => {
      setTickerItems((prevItems) =>
        prevItems.map((item) => {
          const randomChange = (Math.random() - 0.5) * 0.1
          const newPrice = Number.parseFloat((item.price + randomChange).toFixed(2))
          const newChange = Number.parseFloat((newPrice - (item.price - item.change)).toFixed(2))
          const newChangePercent = Number.parseFloat(((newChange / (item.price - item.change)) * 100).toFixed(1))

          return {
            ...item,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
          }
        }),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full bg-muted/30 border-y overflow-hidden py-2">
      <div className="ticker-wrap">
        <div className="ticker">
          {tickerItems.map((item, index) => (
            <div key={index} className="ticker-item flex items-center gap-3">
              <span className="font-mono font-bold">{item.symbol}</span>
              <span className="text-muted-foreground text-sm hidden sm:inline">{item.name}</span>
              <span className="font-medium">${item.price.toFixed(2)}</span>
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  item.change >= 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {item.change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {item.change >= 0 ? "+" : ""}
                {item.change.toFixed(2)} ({item.change >= 0 ? "+" : ""}
                {item.changePercent.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .ticker-wrap {
          width: 100%;
          overflow: hidden;
          height: 2rem;
          padding-left: 100%;
          box-sizing: content-box;
        }
        .ticker {
          display: inline-flex;
          white-space: nowrap;
          padding-right: 100%;
          box-sizing: content-box;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          animation-name: ticker;
          animation-duration: 60s;
        }
        .ticker-item {
          display: inline-flex;
          padding: 0 1rem;
        }
        @keyframes ticker {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }
      `}</style>
    </div>
  )
}

