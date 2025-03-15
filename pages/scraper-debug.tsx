"use client"

import { useState } from "react"
import Head from "next/head"

export default function ScraperDebugPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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

  const testSingleStore = async () => {
    try {
      setLoading(true)
      setError(null)

      // Test with Walmart as an example
      const response = await fetch(
        "/api/test-scraper?url=https://www.walmart.com/search?q=eggs&zipCode=90210&storeName=Walmart",
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Scraper Debug | eggs.live</title>
      </Head>

      <h1 className="text-3xl font-bold mb-6">Scraper Debug</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Scraper</h2>

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

