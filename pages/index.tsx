"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  const [isTyping, setIsTyping] = useState(false)

  // Simulate typing effect for the title
  useEffect(() => {
    setIsTyping(true)
    const timer = setTimeout(() => {
      setIsTyping(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock results
      setResults([
        {
          storeName: "whole foods",
          address: "123 main st, los angeles",
          regularPrice: 4.99,
          organicPrice: 7.99,
          inStock: true,
          distance: 0.8,
        },
        {
          storeName: "ralphs",
          address: "456 oak ave, los angeles",
          regularPrice: 3.99,
          organicPrice: 6.99,
          inStock: true,
          distance: 1.2,
        },
        {
          storeName: "trader joe's",
          address: "789 pine blvd, los angeles",
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
    if (price === null) return "n/a"
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="container mx-auto px-4 py-8 font-mono text-center">
      <header className="mb-12 border-b border-black pb-6 max-w-lg mx-auto">
        <h1 className={`text-4xl font-bold mb-2 tracking-wider ${isTyping ? "typing-effect" : ""}`}>eggs.live</h1>
        <p className="text-xl tracking-wide">real-time egg price tracker</p>
      </header>

      {!searched ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full border border-black p-8 relative mx-auto">
            <div className="absolute top-0 left-0 bg-black text-white px-2 py-1 text-xs">location</div>
            <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6 mt-6">
              <p className="text-lg font-medium text-center">enter your zip code</p>
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "find eggs"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm tracking-wider">tracking prices at 24+ stores</p>
            <p className="text-xs text-gray-500 mt-2 pulse-animation">updated daily</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="tech-card text-center p-6">
              <div className="text-2xl mb-3">🔍</div>
              <h3 className="font-bold">find local prices</h3>
              <p className="text-sm mt-2">search for egg prices near you</p>
            </div>

            <div className="tech-card text-center p-6">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="font-bold">track trends</h3>
              <p className="text-sm mt-2">monitor price changes over time</p>
            </div>

            <div className="tech-card text-center p-6">
              <div className="text-2xl mb-3">🥚</div>
              <h3 className="font-bold">compare types</h3>
              <p className="text-sm mt-2">regular vs organic eggs</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-black pb-4">
            <h2 className="text-2xl font-bold">egg prices near {zipCode}</h2>
            <Button variant="outline" onClick={() => setSearched(false)} className="border-black rounded-none">
              new search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.map((store, index) => (
              <div key={index} className="tech-card bg-white text-center">
                <div className="border-b border-black pb-3 mb-3">
                  <h3 className="font-bold text-lg">{store.storeName}</h3>
                  <p className="text-sm">{store.address}</p>
                  <p className="text-sm">{store.distance.toFixed(1)} miles</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-3">
                    <span>regular:</span>
                    <span className="price-tag">{formatPrice(store.regularPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center px-3">
                    <span>organic:</span>
                    <span className="price-tag">{formatPrice(store.organicPrice)}</span>
                  </div>
                  <div className={`text-sm ${store.inStock ? "text-green-600" : "text-red-600"} font-bold`}>
                    {store.inStock ? "in stock" : "out of stock"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-16 pt-6 border-t border-black text-center text-xs">
        <p>eggs.live © {new Date().getFullYear()} | real-time egg price tracking</p>
      </footer>
    </div>
  )
}

