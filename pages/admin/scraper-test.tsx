"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, MapPin } from "lucide-react"

// List of stores to test
const STORES = [
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

// Store base URLs
const STORE_URLS: Record<string, string> = {
  Walmart: "https://www.walmart.com/search?q=eggs",
  Target: "https://www.target.com/s?searchTerm=eggs",
  "Whole Foods": "https://www.wholefoodsmarket.com/search?text=eggs",
  Ralphs: "https://www.ralphs.com/search?query=eggs",
  Vons: "https://www.vons.com/shop/search-results.html?q=eggs",
  Albertsons: "https://www.albertsons.com/shop/search-results.html?q=eggs",
  "Food 4 Less": "https://www.food4less.com/search?query=eggs",
  Sprouts: "https://shop.sprouts.com/search?search_term=eggs",
  Erewhon: "https://www.erewhonmarket.com/search?q=eggs",
  "Gelson's": "https://www.gelsons.com/shop/search-results.html?q=eggs",
  "Smart & Final": "https://www.smartandfinal.com/shop/search-results.html?q=eggs",
  Pavilions: "https://www.pavilions.com/shop/search-results.html?q=eggs",
}

export default function ScraperTestPage() {
  const [storeName, setStoreName] = useState("Walmart")
  const [zipCode, setZipCode] = useState("90210")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [nearbyLocations, setNearbyLocations] = useState<any[]>([])

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setNearbyLocations([])

    try {
      // Get the base URL for the selected store
      const baseUrl = STORE_URLS[storeName] || `https://www.google.com/search?q=${encodeURIComponent(storeName)}+eggs`

      const response = await fetch(
        `/api/test-scraper?url=${encodeURIComponent(baseUrl)}&storeName=${encodeURIComponent(storeName)}&zipCode=${zipCode}`,
      )
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error || "Failed to test scraper")
        if (data.nearbyLocations) {
          setNearbyLocations(data.nearbyLocations)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Scraper Test Tool</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Firecrawl Scraper</CardTitle>
          <CardDescription>Test the scraper with a specific store and ZIP code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store</label>
            <select
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STORES.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <Input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="90210"
              maxLength={5}
              pattern="[0-9]{5}"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTest} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Scraper"
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Card className="mb-8 border-red-300">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Store Not Found
            </CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          {nearbyLocations.length > 0 && (
            <CardContent>
              <h3 className="font-medium mb-3">Try these ZIP codes instead:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {nearbyLocations.map((zipCode, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => {
                      setZipCode(zipCode)
                      handleTest()
                    }}
                    className="text-center"
                  >
                    {zipCode}
                  </Button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {results.usingMock ? "Using mock data (API key not configured)" : "Using real Firecrawl data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.location && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium mb-2">Store Location:</h3>
                  {results.locationVerified ? (
                    <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded">
                      Location Verified
                    </span>
                  ) : (
                    <span className="text-amber-600 text-sm font-medium bg-amber-50 px-2 py-1 rounded">
                      Location Unverified
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{results.location.address}</p>
                    <p className="text-sm text-gray-600">ZIP: {results.location.zipCode}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-medium mb-2">URL Used:</h3>
              <div className="bg-gray-50 p-2 rounded font-mono text-sm overflow-x-auto">{results.url}</div>
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">Location Techniques Used:</h3>
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium text-sm">URL Parameters</p>
                  <p className="text-xs text-gray-600">ZIP code added to URL</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium text-sm">Location Headers</p>
                  <p className="text-xs text-gray-600">Browser headers set to simulate location</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="font-medium text-sm">Location Cookies</p>
                  <p className="text-xs text-gray-600">Cookies set with location information</p>
                </div>
                {results.formFilled && (
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="font-medium text-sm">Form Filling</p>
                    <p className="text-xs text-gray-600">ZIP code form automatically filled</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

