"use client"

import { useState } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEggPriceData } from "@/hooks/use-egg-price-data"
import { Button } from "@/components/ui/button"

export function EggPriceChart() {
  const [timeframe, setTimeframe] = useState("1M")
  const [eggType, setEggType] = useState("regular")
  const { priceData, isLoading } = useEggPriceData(timeframe, eggType)

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center font-mono uppercase">
        <div className="animate-pulse text-white">LOADING DATA...</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-gray-700 p-3 font-mono uppercase">
          <p className="text-gray-400 mb-1">
            {new Date(label)
              .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              .toUpperCase()}
          </p>
          <p className="text-lg font-bold text-white">${payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full w-full relative font-mono uppercase">
      {/* Egg type selector */}
      <div className="absolute top-0 right-0 z-10 flex space-x-2 mb-4">
        <Button
          variant={eggType === "regular" ? "default" : "outline"}
          size="sm"
          onClick={() => setEggType("regular")}
          className="text-xs"
        >
          REGULAR
        </Button>
        <Button
          variant={eggType === "organic" ? "default" : "outline"}
          size="sm"
          onClick={() => setEggType("organic")}
          className="text-xs"
        >
          ORGANIC
        </Button>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={priceData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={{ stroke: "#555555" }}
            tickLine={{ stroke: "#555555" }}
            tick={{ fill: "#ffffff", fontSize: 10, fontFamily: "monospace" }}
            tickFormatter={(date) => {
              const d = new Date(date)
              return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
            }}
          />
          <YAxis
            domain={["auto", "auto"]}
            axisLine={{ stroke: "#555555" }}
            tickLine={{ stroke: "#555555" }}
            tick={{ fill: "#ffffff", fontSize: 10, fontFamily: "monospace" }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#ffffff"
            strokeWidth={1}
            fill="url(#colorPrice)"
            activeDot={{ r: 4, fill: "#ffffff", stroke: "#ffffff", strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Grid lines overlay for terminal effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full grid grid-cols-12 grid-rows-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`h-${i}`} className="border-t border-gray-800" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`v-${i}`} className="border-l border-gray-800" />
          ))}
        </div>
      </div>
    </div>
  )
}

