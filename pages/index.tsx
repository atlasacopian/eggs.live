"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Store } from "lucide-react"

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
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-2 text-center">eggs.live</h1>
      <p className="text-xl text-gray-600 mb-8 text-center">Find egg prices near you in Los Angeles</p>

      {!searched ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="relative">
            {/* Egg shape container */}
            <div className="egg-shape relative flex items-center justify-center">
              <form onSubmit={handleSubmit} className="absolute z-10 flex flex-col items-center">
                <p className="text-lg font-medium mb-2 text-center">Enter your ZIP code</p>
                <div className="flex flex-col items-center gap-4">
                  <Input
                    type="text"
                    placeholder="90210"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    pattern="[0-9]{5}"
                    maxLength={5}
                    className="w-32 text-center text-xl font-bold"
                    required
                  />
                  <Button type="submit" disabled={loading} className="rounded-full px-8">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Find Eggs"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <style jsx global>{`
            .egg-shape {
              width: 280px;
              height: 380px;
              background-color: #fff9e6;
              border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(0deg);
              position: relative;
              overflow: hidden;
            }
            
            .egg-shape::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 50%;
              background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), transparent);
              border-radius: 50% 50% 0 0 / 60% 60% 0 0;
            }
          `}</style>
        </div>
      ) : (
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Egg Prices Near {zipCode}</h2>
            <Button variant="outline" onClick={() => setSearched(false)}>
              New Search
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((store, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    {store.storeName}
                  </h3>
                  <p className="text-sm text-gray-500">{store.address}</p>
                  <p className="text-sm text-gray-500">{store.distance.toFixed(1)} miles away</p>
                </div>
                <div className="p-4 space-y-2">
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

