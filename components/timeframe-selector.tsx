"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export function TimeframeSelector() {
  const [selected, setSelected] = useState("1M")

  const timeframes = [
    { id: "1W", label: "1W" },
    { id: "1M", label: "1M" },
    { id: "3M", label: "3M" },
    { id: "6M", label: "6M" },
    { id: "1Y", label: "1Y" },
    { id: "ALL", label: "ALL" },
  ]

  return (
    <div className="flex font-mono uppercase">
      {timeframes.map((timeframe) => (
        <button
          key={timeframe.id}
          className={cn(
            "px-3 py-1 text-sm font-medium border transition-colors",
            selected === timeframe.id
              ? "bg-white text-black border-white"
              : "text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white",
          )}
          onClick={() => setSelected(timeframe.id)}
        >
          {timeframe.label}
        </button>
      ))}
    </div>
  )
}

