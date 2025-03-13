"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Store, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface StorePrice {
  storeName: string
  address: string
  regularPrice: number | null
  organicPrice: number | null
  inStock: boolean
  distance: number // in miles
}

export default function ResultsPage() {
  const router = useRouter()
  const { zipCode } = router.query

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<StorePrice[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!zipCode) {
      return // Wait for router to be ready
    }

    const fetchStores = async () => {
      try {
        const response = await fetch(`/api/stores-by-zip?zipCode=${zipCode}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch store data")
        }

        setResults(data.stores || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [zipCode])

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A"
    return `$${price.toFixed(2)}`
  }

  if (!zipCode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center mb-6 text-primary hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to search
      </Link>

      <h1 className="text-3xl font-bold mb-2">Egg Prices Near {zipCode}</h1>
      <p className="text-gray-600 mb-8">Showing stores with egg prices in and around your area</p>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading stores...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/">
            <Button>Try another ZIP code</Button>
          </Link>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground mb-4">No stores found with egg prices in this area</p>
          <Link href="/">
            <Button>Try another ZIP code</Button>
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  )
}

