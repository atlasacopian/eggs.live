"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

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

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // Add zip code to URL if not already present
      let testUrl = url
      if (zipCode && !url.includes("zipCode=")) {
        testUrl += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
      }

      const response = await fetch(
        `/api/test-scraper?url=${encodeURIComponent(testUrl)}&storeName=${encodeURIComponent(storeName)}`,
      )
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.message || "Failed to test scraper")
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
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
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
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
              <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

