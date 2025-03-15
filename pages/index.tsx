"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Store, ArrowRight } from "lucide-react"

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
          storeName: "WHOLE FOODS",
          address: "123 MAIN ST, LOS ANGELES",
          regularPrice: 4.99,
          organicPrice: 7.99,
          inStock: true,
          distance: 0.8,
        },
        {
          storeName: "RALPHS",
          address: "456 OAK AVE, LOS ANGELES",
          regularPrice: 3.99,
          organicPrice: 6.99,
          inStock: true,
          distance: 1.2,
        },
        {
          storeName: "TRADER JOE'S",
          address: "789 PINE BLVD, LOS ANGELES",
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
    <div className="container mx-auto px-4 py-8 font-mono">
      <header className="mb-12 border-b border-black pb-6">
        <h1 className="text-4xl font-bold mb-2 text-center tracking-wider">EGGS.LIVE</h1>
        <p className="text-xl text-center tracking-wide">REAL-TIME EGG PRICE TRACKER</p>
      </header>

      {!searched ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full border border-black p-8 relative">
            <div className="absolute top-0 left-0 bg-black text-white px-2 py-1 text-xs">LOCATION</div>
            <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6 mt-6">
              <p className="text-lg font-medium text-center">ENTER YOUR ZIP CODE</p>
              <div className="flex flex-col items-center gap-4 w-full">
                <Input
                  type="text"
                  placeholder="90210"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="w-32 text-center text-xl font-bold border-black rounded-none"
                  required
                />
                <Button type="submit" disabled={loading} className="tech-button w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "FIND EGGS"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm uppercase tracking-wider">TRACKING PRICES AT 24+ STORES</p>
            <p className="text-xs text-gray-500 mt-2">UPDATED DAILY</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-black pb-4">
            <h2 className="text-2xl font-bold">EGG PRICES NEAR {zipCode}</h2>
            <Button
              variant="outline"
              onClick={() => setSearched(false)}
              className="border-black rounded-none uppercase"
            >
              NEW SEARCH
            </Button>
          </div>

          <div className="tech-grid">
            {results.map((store, index) => (
              <div key={index} className="tech-card bg-white">
                <div className="border-b border-black pb-3 mb-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    {store.storeName}
                  </h3>
                  <p className="text-sm">{store.address}</p>
                  <p className="text-sm">{store.distance.toFixed(1)} MILES</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>REGULAR:</span>
                    <span className="price-tag">{formatPrice(store.regularPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ORGANIC:</span>
                    <span className="price-tag">{formatPrice(store.organicPrice)}</span>
                  </div>
                  <div className={`text-sm ${store.inStock ? "text-green-600" : "text-red-600"} font-bold`}>
                    {store.inStock ? "IN STOCK" : "OUT OF STOCK"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-16 pt-6 border-t border-black text-center text-xs">
        <p>EGGS.LIVE © {new Date().getFullYear()} | REAL-TIME EGG PRICE TRACKING</p>
      </footer>
    </div>
  )
}

