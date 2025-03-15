"use client"

import { useState, useEffect } from "react"
import Head from "next/head"

export default function HomePage() {
  const [cheapestRegular, setCheapestRegular] = useState([])
  const [cheapestOrganic, setCheapestOrganic] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [zipCode, setZipCode] = useState("")
  const [includeOutOfStock, setIncludeOutOfStock] = useState(false)

  useEffect(() => {
    fetchPrices()
  }, [])

  const fetchPrices = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = new URL("/api/cheapest-eggs", window.location.origin)
      if (zipCode) {
        url.searchParams.append("zipCode", zipCode)
      }
      url.searchParams.append("includeOutOfStock", includeOutOfStock.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success) {
        setCheapestRegular(data.cheapestRegular || [])
        setCheapestOrganic(data.cheapestOrganic || [])
      } else {
        throw new Error(data.message || "Failed to fetch data")
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchPrices()
  }

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>eggs.live - Real-time Egg Price Tracker</title>
        <meta name="description" content="Track egg prices in real-time" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-2">eggs.live</h1>
        <p className="text-gray-600 text-center mb-8">real-time egg price tracker</p>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="mb-6 flex gap-4 items-center justify-center">
            <input
              type="text"
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              pattern="[0-9]{5}"
              maxLength={5}
              className="border border-gray-300 rounded px-3 py-2 w-32"
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              disabled={loading}
            >
              {loading ? "Loading..." : "Search"}
            </button>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeOutOfStock}
                onChange={(e) => setIncludeOutOfStock(e.target.checked)}
                className="h-4 w-4"
              />
              Include out of stock
            </label>
          </form>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading egg prices...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={fetchPrices} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Regular Eggs Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Cheapest Regular Eggs</h2>
                {cheapestRegular.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cheapestRegular.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg overflow-hidden shadow-sm ${
                          !item.inStock ? "border-red-300 bg-red-50" : ""
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold">{item.storeName}</h3>
                            <div className="text-xl font-bold text-amber-600">{formatPrice(item.price)}</div>
                          </div>
                          <div className="mt-2">
                            {item.inStock ? (
                              <div className="text-green-600 font-medium">In Stock</div>
                            ) : (
                              <div className="text-red-600 font-medium">Out of Stock</div>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <div>{item.address}</div>
                            <div>ZIP: {item.zipCode}</div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Updated: {formatDate(item.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No regular egg prices found {zipCode ? `in ${zipCode}` : ""}
                  </p>
                )}
              </div>

              {/* Organic Eggs Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Cheapest Organic Eggs</h2>
                {cheapestOrganic.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cheapestOrganic.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg overflow-hidden shadow-sm ${
                          !item.inStock ? "border-red-300 bg-red-50" : ""
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold">{item.storeName}</h3>
                            <div className="text-xl font-bold text-amber-600">{formatPrice(item.price)}</div>
                          </div>
                          <div className="mt-2">
                            {item.inStock ? (
                              <div className="text-green-600 font-medium">In Stock</div>
                            ) : (
                              <div className="text-red-600 font-medium">Out of Stock</div>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <div>{item.address}</div>
                            <div>ZIP: {item.zipCode}</div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Updated: {formatDate(item.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No organic egg prices found {zipCode ? `in ${zipCode}` : ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-gray-500 text-sm">
        <p>© 2023 eggs.live - Real-time egg price tracker</p>
      </footer>
    </div>
  )
}

