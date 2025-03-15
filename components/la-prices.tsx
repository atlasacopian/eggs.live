"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'

interface SimplePriceData {
  success: boolean
  message?: string
  error?: string
  details?: string
  eggType: string
  priceCount: number
  prices: Array<{
    id: number
    price: number
    date: string
    storeLocationId: number
  }>
}

export function LAPrices() {
  const [priceData, setPriceData] = useState<SimplePriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eggType, setEggType] = useState<"regular" | "organic">("regular")

  useEffect(() => {
    async function fetchLAPrices() {
      try {
        setLoading(true)
        setError(null)

        const url = `/api/la-prices?eggType=${eggType}`
        console.log("Fetching prices from:", url)

        const response = await fetch(url)

        // Log the raw response for debugging
        const responseText = await response.text()
        console.log("Raw API response:", responseText)

        // Try to parse the response as JSON
        let data
        try {
          data = JSON.parse(responseText)
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError)
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`)
        }

        // Check if the response indicates an error
        if (!response.ok || !data.success) {
          const errorMessage = data.message || data.error || `API error: ${response.status} ${response.statusText}`
          console.error("API error:", errorMessage, data)
          throw new Error(errorMessage)
        }

        setPriceData(data)
      } catch (err: unknown) {
        console.error("Error fetching LA prices:", err)
        setError(err instanceof Error ? err.message : "Failed to load price data")
        setPriceData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLAPrices()
  }, [eggType])

  const formatPrice = (price: number) => {
    return price ? `$${price.toFixed(2)}` : "$0.00"
  }

  // Handle tab change manually
  const handleTabChange = (value: string) => {
    if (value === "regular" || value === "organic") {
      setEggType(value)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <button
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              eggType === "regular" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"
            }`}
            onClick={() => handleTabChange("regular")}
          >
            Regular Eggs
          </button>
          <button
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              eggType === "organic" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"
            }`}
            onClick={() => handleTabChange("organic")}
          >
            Organic Eggs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading egg prices...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : !priceData || !priceData.prices || priceData.prices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground mb-4">No egg prices available for today</p>
          <p className="text-sm text-muted-foreground mb-4">Try running the scraper first</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Found {priceData.priceCount} prices for {priceData.eggType} eggs
              </p>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Raw Price Data:</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-xs">{JSON.stringify(priceData.prices, null, 2)}</pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-muted/50 p-3 text-sm font-medium">
                  <div className="col-span-4">ID</div>
                  <div className="col-span-4">Store Location ID</div>
                  <div className="col-span-4 text-right">Price</div>
                </div>
                <div className="divide-y">
                  {priceData.prices.map((price) => (
                    <div key={price.id} className="grid grid-cols-12 p-3 text-sm">
                      <div className="col-span-4 font-medium">{price.id}</div>
                      <div className="col-span-4">{price.storeLocationId}</div>
                      <div className="col-span-4 text-right font-medium">{formatPrice(price.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
