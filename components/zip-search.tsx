"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Store } from "lucide-react"

interface StorePrice {
  storeName: string
  address: string
  regularPrice: number | null
  organicPrice: number | null
  inStock: boolean
  distance: number // in miles
}

export function ZipSearch() {
  const [zipCode, setZipCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<StorePrice[]>([])
  const [error, setError] = useState<string | null>(null)

  const searchStores = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/stores-by-zip?zipCode=${zipCode}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch store data")
      }

      setResults(data.stores)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A"
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      <form onSubmit={searchStores} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter ZIP code"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          pattern="[0-9]{5}"
          maxLength={5}
          className="w-32"
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((store, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {store.storeName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{store.address}</p>
              <p className="text-sm text-muted-foreground">{store.distance.toFixed(1)} miles away</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Regular Eggs:</span>
                  <span className="font-medium">{formatPrice(store.regularPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Organic Eggs:</span>
                  <span className="font-medium">{formatPrice(store.organicPrice)}</span>
                </div>
                <div className={`text-sm ${store.inStock ? "text-green-600" : "text-red-600"}`}>
                  {store.inStock ? "In Stock" : "Out of Stock"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

