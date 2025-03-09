"use client"

import { formatDate } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PriceHistoryGraphProps {
  data: {
    date: Date
    price: number
    storeCount: number
  }[]
}

export function PriceHistoryGraph({ data }: PriceHistoryGraphProps) {
  // Format the data for the chart
  const chartData = data.map((item) => ({
    date: formatDate(item.date),
    price: item.price,
    storeCount: item.storeCount,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9CA3AF" }}
            tickLine={{ stroke: "#4B5563" }}
            axisLine={{ stroke: "#4B5563" }}
            tickFormatter={(value) => {
              // Only show every 7th date to avoid crowding
              const index = chartData.findIndex((item) => item.date === value)
              return index % 7 === 0 ? value : ""
            }}
          />
          <YAxis
            tick={{ fill: "#9CA3AF" }}
            tickLine={{ stroke: "#4B5563" }}
            axisLine={{ stroke: "#4B5563" }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111",
              border: "1px solid #333",
              color: "#9CA3AF",
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 4 }}
            activeDot={{ fill: "#10B981", r: 6, stroke: "#111", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

