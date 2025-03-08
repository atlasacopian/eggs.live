"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useEggPriceHistory } from "@/hooks/use-egg-price-history"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export function EggChart() {
  const [eggType, setEggType] = useState("LRG-W")
  const [timeRange, setTimeRange] = useState("1M")
  const [chartType, setChartType] = useState("candle")
  const { history, isLoading } = useEggPriceHistory(eggType, timeRange)

  const eggTypes = [
    { id: "LRG-W", name: "Large White (LRG-W)" },
    { id: "LRG-B", name: "Large Brown (LRG-B)" },
    { id: "ORG", name: "Organic (ORG)" },
    { id: "FR", name: "Free Range (FR)" },
  ]

  const timeRanges = [
    { id: "1D", name: "1 Day" },
    { id: "1W", name: "1 Week" },
    { id: "1M", name: "1 Month" },
    { id: "3M", name: "3 Months" },
    { id: "1Y", name: "1 Year" },
    { id: "5Y", name: "5 Years" },
  ]

  if (isLoading) {
    return <p>Loading chart data...</p>
  }

  const renderChart = () => {
    switch (chartType) {
      case "candle":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const d = new Date(date)
                  return timeRange === "1D"
                    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : d.toLocaleDateString([], { month: "short", day: "numeric" })
                }}
              />
              <YAxis domain={["auto", "auto"]} tickFormatter={(value) => `$${value.toFixed(2)}`} />
              <Tooltip
                formatter={(value) => [`$${value}`, "Price"]}
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#8884d8"
                name="Close Price"
                dot={false}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="open"
                stroke="#82ca9d"
                name="Open Price"
                dot={false}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const d = new Date(date)
                  return timeRange === "1D"
                    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : d.toLocaleDateString([], { month: "short", day: "numeric" })
                }}
              />
              <YAxis domain={["auto", "auto"]} tickFormatter={(value) => `$${value.toFixed(2)}`} />
              <Tooltip
                formatter={(value) => [`$${value}`, "Price"]}
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                name="Close Price"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      case "volume":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const d = new Date(date)
                  return timeRange === "1D"
                    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : d.toLocaleDateString([], { month: "short", day: "numeric" })
                }}
              />
              <YAxis tickFormatter={(value) => `${value}k doz`} />
              <Tooltip
                formatter={(value) => [`${value}k dozen`, "Volume"]}
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Legend />
              <Bar dataKey="volume" fill="#82ca9d" name="Trading Volume" />
            </BarChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Price Chart</CardTitle>
            <CardDescription>Historical egg price data</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={eggType} onValueChange={setEggType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select egg type" />
              </SelectTrigger>
              <SelectContent>
                {eggTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.id} value={range.id}>
                    {range.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={chartType === "candle" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("candle")}
          >
            Candlestick
          </Button>
          <Button variant={chartType === "area" ? "default" : "outline"} size="sm" onClick={() => setChartType("area")}>
            Area
          </Button>
          <Button
            variant={chartType === "volume" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("volume")}
          >
            Volume
          </Button>
        </div>

        <div className="h-[400px]">{renderChart()}</div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-2 border rounded-md">
            <div className="text-xs text-muted-foreground">Open</div>
            <div className="font-medium">${history[0]?.open.toFixed(2)}</div>
          </div>
          <div className="p-2 border rounded-md">
            <div className="text-xs text-muted-foreground">High</div>
            <div className="font-medium">${Math.max(...history.map((h) => h.high)).toFixed(2)}</div>
          </div>
          <div className="p-2 border rounded-md">
            <div className="text-xs text-muted-foreground">Low</div>
            <div className="font-medium">${Math.min(...history.map((h) => h.low)).toFixed(2)}</div>
          </div>
          <div className="p-2 border rounded-md">
            <div className="text-xs text-muted-foreground">Close</div>
            <div className="font-medium">${history[history.length - 1]?.close.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

