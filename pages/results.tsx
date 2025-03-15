"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
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
      <div className="container mx-auto px-4 py-8 font-mono">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 font-mono">
      <Link href="/" className="inline-flex items-center mb-6 text-black hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        BACK TO SEARCH
      </Link>

      <h1 className="text-3xl font-bold mb-2 uppercase tracking-wider">EGG PRICES NEAR {zipCode}</h1>
      <p className="text-gray-600 mb-8 uppercase tracking-wide">SHOWING STORES WITH EGG PRICES IN YOUR AREA</p>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <span className="ml-2 uppercase">LOADING STORES...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4 uppercase">{error}</p>
          <Link href="/">
            <Button>TRY ANOTHER ZIP CODE</Button>
          </Link>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600 mb-4 uppercase">NO STORES FOUND WITH EGG PRICES IN THIS AREA</p>
          <Link href="/">
            <Button>TRY ANOTHER ZIP CODE</Button>
          </Link>
        </div>
      ) : (
        <div className="tech-grid">
          {results.map((store, index) => (
            <div key={index} className="tech-card">
              <div className="border-b border-black pb-3 mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2 uppercase">
                  <Store className="h-5 w-5" />
                  {store.storeName}
                </h3>
                <p className="text-sm uppercase">{store.address}</p>
                <p className="text-sm uppercase">{store.distance.toFixed(1)} MILES AWAY</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>REGULAR EGGS:</span>
                  <span className="price-tag">{formatPrice(store.regularPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ORGANIC EGGS:</span>
                  <span className="price-tag">{formatPrice(store.organicPrice)}</span>
                </div>
                <div className={`text-sm ${store.inStock ? "text-green-600" : "text-red-600"} font-bold uppercase`}>
                  {store.inStock ? "IN STOCK" : "OUT OF STOCK"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

