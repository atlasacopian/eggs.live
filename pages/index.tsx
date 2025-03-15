"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowRight } from "lucide-react"

interface StorePrice {
  storeName: string
  address: string
  regularPrice: number | null
  organicPrice: number | null
  inStock: boolean
  distance: number
}

export default function HomePage() {
  const [zipCode, setZipCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<StorePrice[]>([])
  const [searched, setSearched] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock results
      setResults([
        {
          storeName: "Whole Foods",
          address: "123 Main St, Los Angeles",
          regularPrice: 4.99,
          organicPrice: 7.99,
          inStock: true,
          distance: 0.8,
        },
        {
          storeName: "Ralphs",
          address: "456 Oak Ave, Los Angeles",
          regularPrice: 3.99,
          organicPrice: 6.99,
          inStock: true,
          distance: 1.2,
        },
        {
          storeName: "Trader Joe's",
          address: "789 Pine Blvd, Los Angeles",
          regularPrice: 3.49,
          organicPrice: 5.99,
          inStock: false,
          distance: 1.5,
        },
      ])

      setSearched(true)
    } catch (error) {
      console.error("Error fetching results:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A"
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="container mx-auto px-4 py-8 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
          eggs.live
        </h1>
        <p className="text-xl text-gray-600">real-time egg price tracker</p>
      </header>

      {!searched ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="egg-container mb-8">
            <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
              <p className="text-lg font-medium text-center mb-2">Enter your zip code</p>
              <div className="flex flex-col items-center gap-4 w-full">
                <Input
                  type="text"
                  placeholder="90210"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="w-32 text-center text-xl font-bold border-amber-400 rounded-full bg-white"
                  required
                />
                <Button type="submit" disabled={loading} className="modern-button">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Find Eggs"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">Tracking prices at 24+ stores</p>
            <p className="text-xs text-amber-500 mt-2">Updated daily</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="feature-card">
              <div className="text-3xl mb-4 text-amber-500">🔍</div>
              <h3 className="font-bold text-lg mb-2">Find Local Prices</h3>
              <p className="text-gray-600">Search for egg prices near you</p>
            </div>

            <div className="feature-card">
              <div className="text-3xl mb-4 text-amber-500">📊</div>
              <h3 className="font-bold text-lg mb-2">Track Trends</h3>
              <p className="text-gray-600">Monitor price changes over time</p>
            </div>

            <div className="feature-card">
              <div className="text-3xl mb-4 text-amber-500">🥚</div>
              <h3 className="font-bold text-lg mb-2">Compare Types</h3>
              <p className="text-gray-600">Regular vs organic eggs</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold">Egg Prices Near {zipCode}</h2>
            <Button
              variant="outline"
              onClick={() => setSearched(false)}
              className="border-amber-400 text-amber-600 hover:bg-amber-50"
            >
              New Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.map((store, index) => (
              <div key={index} className="result-card">
                <div className="border-b border-gray-200 pb-3 mb-3">
                  <h3 className="font-bold text-lg">{store.storeName}</h3>
                  <p className="text-sm text-gray-500">{store.address}</p>
                  <p className="text-sm text-gray-500">{store.distance.toFixed(1)} miles</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Regular:</span>
                    <span className="price-tag">{formatPrice(store.regularPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Organic:</span>
                    <span className="price-tag">{formatPrice(store.organicPrice)}</span>
                  </div>
                  <div
                    className={`text-sm text-center ${store.inStock ? "text-green-600" : "text-red-600"} font-medium`}
                  >
                    {store.inStock ? "In Stock" : "Out of Stock"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-16 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>eggs.live © {new Date().getFullYear()} | real-time egg price tracking</p>
      </footer>
    </div>
  )
}

