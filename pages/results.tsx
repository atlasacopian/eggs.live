"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface StorePrice {
  storeName: string
  address: string
  regularPrice: number | null
  organicPrice: number | null
  inStock: boolean
  distance: number
}

export default function ResultsPage() {
  const router = useRouter()
  const { zipCode } = router.query

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<StorePrice[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!zipCode) return

    const fetchStores = async () => {
      setLoading(true)
      setError(null)

      try {
        // Use the actual API endpoint
        const response = await fetch(`/api/stores-by-zip?zipCode=${zipCode}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to fetch store data")
        }

        const data = await response.json()

        if (data.success && data.stores) {
          setResults(
            data.stores.map((store: any) => ({
              storeName: store.storeName,
              address: store.address || "Address not available",
              regularPrice: store.regularPrice,
              organicPrice: store.organicPrice,
              inStock: store.inStock,
              distance: store.distance || 0,
            })),
          )
        } else {
          throw new Error(data.message || "No stores found")
        }
      } catch (err) {
        console.error("Error fetching stores:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
        setResults([])
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center mb-6 text-black hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to search
      </Link>

      <h1 className="text-3xl font-bold mb-2 text-center">Egg Prices Near {zipCode}</h1>
      <p className="text-gray-600 mb-8 text-center">Showing stores with egg prices in your area</p>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading stores...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/">
            <Button className="bg-black text-white hover:bg-gray-800">Try Another ZIP Code</Button>
          </Link>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-gray-600 mb-4">No stores found with egg prices in this area</p>
          <Link href="/">
            <Button className="bg-black text-white hover:bg-gray-800">Try Another ZIP Code</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {results.map((store, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="border-b border-gray-200 pb-3 mb-3">
                <h3 className="font-bold text-lg">{store.storeName}</h3>
                <p className="text-sm text-gray-500">{store.address}</p>
                <p className="text-sm text-gray-500">{store.distance.toFixed(1)} miles away</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Regular:</span>
                  <span className="font-bold">{formatPrice(store.regularPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Organic:</span>
                  <span className="font-bold">{formatPrice(store.organicPrice)}</span>
                </div>
                <div className={`text-sm text-center ${store.inStock ? "text-green-600" : "text-red-600"} font-medium`}>
                  {store.inStock ? "In Stock" : "Out of Stock"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

