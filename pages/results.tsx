"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"
import { MapPin, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface EggPrice {
  price: number
  storeName: string
  address: string
  zipCode: string
  date: string
  id: number
  storeLocationId: number
  inStock: boolean
}

export default function ResultsPage() {
  const router = useRouter()
  const { zipCode } = router.query

  const [prices, setPrices] = useState<{
    regular: EggPrice[]
    organic: EggPrice[]
    outOfStock: EggPrice[]
  }>({ regular: [], organic: [], outOfStock: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeOutOfStock, setIncludeOutOfStock] = useState(false)
  const [activeTab, setActiveTab] = useState("regular")

  useEffect(() => {
    if (zipCode) {
      fetchPrices()
    }
  }, [zipCode, includeOutOfStock])

  const fetchPrices = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = new URL("/api/cheapest-eggs", window.location.origin)
      url.searchParams.append("zipCode", zipCode as string)
      url.searchParams.append("includeOutOfStock", includeOutOfStock.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success) {
        setPrices({
          regular: data.cheapestRegular || [],
          organic: data.cheapestOrganic || [],
          outOfStock: data.outOfStock || [],
        })
      } else {
        throw new Error(data.message || "Failed to fetch data")
      }
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  if (!zipCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Egg Prices Near {zipCode} | eggs.live</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to search
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Egg Prices Near {zipCode}</h1>
            <p className="text-gray-600">Showing the cheapest eggs in your area</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("regular")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === "regular" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Regular Eggs
              </button>
              <button
                onClick={() => setActiveTab("organic")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === "organic" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Organic Eggs
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={includeOutOfStock}
                onChange={(e) => setIncludeOutOfStock(e.target.checked)}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              Include out of stock
            </label>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading egg prices for ZIP code {zipCode}...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={fetchPrices} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prices[activeTab as "regular" | "organic"].length > 0 ? (
                prices[activeTab as "regular" | "organic"].map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg border shadow-sm overflow-hidden ${
                      !item.inStock ? "border-red-200 bg-red-50" : ""
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg">{item.storeName}</h3>
                        <div className="text-2xl font-bold text-amber-600">{formatPrice(item.price)}</div>
                      </div>

                      <div className="flex items-center mb-3">
                        {item.inStock ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">In Stock</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{item.address}</p>
                          <p className="font-medium">ZIP: {item.zipCode}</p>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">Updated: {formatDate(item.date)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">
                    No {activeTab} egg prices found in ZIP code {zipCode}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Out of Stock Section */}
          {!includeOutOfStock && prices.outOfStock.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Out of Stock Locations</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {prices.outOfStock.map((item) => (
                  <div key={item.id} className="bg-red-50 rounded-lg border border-red-200 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-red-800">{item.storeName}</h3>
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">Out of Stock</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-red-700 mb-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{item.address}</p>
                          <p className="font-medium">ZIP: {item.zipCode}</p>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-red-500">Updated: {formatDate(item.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

