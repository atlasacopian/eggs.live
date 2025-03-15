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

export default function ScraperTestPage() {
  const [url, setUrl] = useState("https://www.walmart.com/search?q=eggs")
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
      const response = await fetch(
        `/api/test-scraper?url=${encodeURIComponent(url)}&storeName=${encodeURIComponent(storeName)}&zipCode=${zipCode}`,
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
          <CardDescription>Test the scraper with a specific URL and store name</CardDescription>
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
            <label className="block text-sm font-medium mb-1">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.example.com/search?q=eggs"
            />
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
            <CardTitle className="text-red-700">
              <AlertCircle className="inline-block w-5 h-5 mr-2" />
              {error}
            </CardTitle>
          </CardHeader>
          {nearbyLocations.length > 0 && (
            <CardContent>
              <h3 className="font-medium mb-3">Nearby Locations:</h3>
              <div className="space-y-3">
                {nearbyLocations.map((location, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-white rounded border">
                    <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-gray-600">{location.address}</p>
                      <p className="text-sm text-gray-500">ZIP: {location.zipCode}</p>
                    </div>
                  </div>
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
                <h3 className="font-medium mb-2">Store Location:</h3>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{results.location.address}</p>
                    <p className="text-sm text-gray-600">ZIP: {results.location.zipCode}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

