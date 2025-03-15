"use client"

import { useState } from "react"
import Head from "next/head"

export default function ScraperDebugPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [zipCode, setZipCode] = useState("90210")
  const [selectedStore, setSelectedStore] = useState("Walmart")

  const stores = [
    "Walmart",
    "Target",
    "Whole Foods",
    "Ralphs",
    "Vons",
    "Albertsons",
    "Food 4 Less",
    "Sprouts",
    "Erewhon",
    "Gelson's",
    "Smart & Final",
    "Pavilions",
  ]

  // Helper function to format store URLs with the correct ZIP code parameter
  const formatStoreUrlWithZipCode = (baseUrl: string, storeName: string, zipCode: string): string => {
    // Default approach - append zipCode parameter
    let url = baseUrl

    // Store-specific URL formatting
    switch (storeName) {
      case "Walmart":
        // Walmart uses 'zipCode' parameter
        if (!url.includes("zipCode=")) {
          url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
        }
        break

      case "Target":
        // Target uses 'zipcode' parameter (lowercase 'c')
        if (!url.includes("zipcode=")) {
          url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
        }
        break

      case "Whole Foods":
        // Whole Foods uses 'location' parameter
        if (!url.includes("location=")) {
          url += (url.includes("?") ? "&" : "?") + `location=${zipCode}`
        }
        break

      // Kroger-owned stores
      case "Ralphs":
      case "Food 4 Less":
        // Kroger-owned stores use 'locationId' parameter
        if (!url.includes("locationId=")) {
          url += (url.includes("?") ? "&" : "?") + `locationId=${zipCode}`
        }
        break

      // Albertsons Companies stores
      case "Albertsons":
      case "Vons":
      case "Pavilions":
        // Albertsons Companies stores use 'zipcode' parameter
        if (!url.includes("zipcode=")) {
          url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
        }
        break

      case "Sprouts":
        // Sprouts uses 'postal_code' parameter
        if (!url.includes("postal_code=")) {
          url += (url.includes("?") ? "&" : "?") + `postal_code=${zipCode}`
        }
        break

      case "Erewhon":
        // Erewhon uses 'postalCode' parameter
        if (!url.includes("postalCode=")) {
          url += (url.includes("?") ? "&" : "?") + `postalCode=${zipCode}`
        }
        break

      case "Gelson's":
        // Gelson's uses 'zip' parameter
        if (!url.includes("zip=")) {
          url += (url.includes("?") ? "&" : "?") + `zip=${zipCode}`
        }
        break

      case "Smart & Final":
        // Smart & Final uses 'zipcode' parameter
        if (!url.includes("zipcode=")) {
          url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
        }
        break

      default:
        // For any other stores, use the most common format
        if (!url.includes("zipCode=") && !url.includes("zipcode=") && !url.includes("zip=")) {
          url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
        }
        break
    }

    return url
  }

  const testSingleStore = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build the URL with the store and ZIP code
      let storeUrl = ""
      switch (selectedStore) {
        case "Walmart":
          storeUrl = `https://www.walmart.com/search?q=eggs`
          break
        case "Target":
          storeUrl = `https://www.target.com/s?searchTerm=eggs`
          break
        case "Whole Foods":
          storeUrl = `https://www.wholefoodsmarket.com/search?text=eggs`
          break
        case "Ralphs":
          storeUrl = `https://www.ralphs.com/search?query=eggs`
          break
        case "Vons":
          storeUrl = `https://www.vons.com/shop/search-results.html?q=eggs`
          break
        case "Albertsons":
          storeUrl = `https://www.albertsons.com/shop/search-results.html?q=eggs`
          break
        case "Food 4 Less":
          storeUrl = `https://www.food4less.com/search?query=eggs`
          break
        case "Sprouts":
          storeUrl = `https://shop.sprouts.com/search?search_term=eggs`
          break
        case "Erewhon":
          storeUrl = `https://www.erewhonmarket.com/search?q=eggs`
          break
        case "Gelson's":
          storeUrl = `https://www.gelsons.com/shop/search-results.html?q=eggs`
          break
        case "Smart & Final":
          storeUrl = `https://www.smartandfinal.com/shop/search-results.html?q=eggs`
          break
        case "Pavilions":
          storeUrl = `https://www.pavilions.com/shop/search-results.html?q=eggs`
          break
        default:
          storeUrl = `https://www.${selectedStore.toLowerCase().replace(/\s+/g, "")}.com/search?q=eggs`
      }

      // Apply the correct ZIP code parameter
      storeUrl = formatStoreUrlWithZipCode(storeUrl, selectedStore, zipCode)

      const response = await fetch(
        `/api/test-scraper?url=${encodeURIComponent(storeUrl)}&storeName=${encodeURIComponent(selectedStore)}&zipCode=${zipCode}`,
      )
      const data = await response.json()

      setResults(data)

      if (!data.success) {
        setError(data.message || "Failed to test scraper")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const runSampleScrape = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/cron/scrape-la-sample")
      const data = await response.json()

      setResults(data)

      if (!data.success) {
        setError(data.message || "Failed to run scraper")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Scraper Debug | eggs.live</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">Scraper Debug</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Scraper</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {stores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter ZIP code"
              maxLength={5}
              pattern="[0-9]{5}"
            />
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={testSingleStore}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Single Store
          </button>

          <button
            onClick={runSampleScrape}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Run Sample Scrape
          </button>
        </div>

        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[600px]">
            <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

