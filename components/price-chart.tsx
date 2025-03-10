"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PriceData {
  date: string
  regular: string
  organic: string
}

export function PriceChart({ data }: { data: PriceData[] }) {
  return (
    <ChartContainer
      config={{
        regular: {
          label: "Regular Eggs",
          color: "hsl(var(--chart-1))",
        },
        organic: {
          label: "Organic Eggs",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-full w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            stroke="#00FF00"
            tick={{ fill: "#00FF00" }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis stroke="#00FF00" tick={{ fill: "#00FF00" }} tickFormatter={(value) => `$${value}`} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ color: "#00FF00" }} />
          <Line
            type="monotone"
            dataKey="regular"
            stroke="var(--color-regular)"
            name="Regular Eggs"
            dot={{ stroke: "var(--color-regular)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="organic"
            stroke="var(--color-organic)"
            name="Organic Eggs"
            dot={{ stroke: "var(--color-organic)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

