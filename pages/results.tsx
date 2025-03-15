"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Link from "next/link"

export default function ResultsPage() {
  const router = useRouter()
  const { zipCode } = router.query

  const [prices, setPrices] = useState({ regular: [], organic: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
      url.searchParams.append("zipCode", zipCode.toString())
      url.searchParams.append("includeOutOfStock", includeOutOfStock.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success) {
        setPrices({
          regular: data.cheapestRegular || [],
          organic: data.cheapestOrganic || [],
        })
      } else {
        throw new Error(data.message || "Failed to fetch data")
      }
    } catch (err) {
      console.error("Error:", err)
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => `$${price.toFixed(2)}`
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString()

  if (!zipCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Head>
        <title>Egg Prices Near {zipCode} | eggs.live</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-8">
            ← Back to search
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Egg Prices Near {zipCode}</h1>
            <p className="text-gray-600">Showing the cheapest eggs in your area</p>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mb-8">
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
              <div className="animate-pulse text-gray-600">Loading egg prices...</div>
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
              {prices[activeTab].map((item) => (
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

                    <div
                      className={`inline-flex px-2 py-1 rounded-full text-sm font-medium mb-3 ${
                        item.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.inStock ? "In Stock" : "Out of Stock"}
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>{item.address}</p>
                      <p>ZIP: {item.zipCode}</p>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">Updated: {formatDate(item.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

