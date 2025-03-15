"use client"

import { useState } from "react"
import Head from "next/head"
import Link from "next/link"

export default function ScraperAdminPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null)

  const triggerScrape = async () => {
    try {
      setLoading(true)
      setError(null)
      setResults(null)
      setProgress({ completed: 0, total: 0 })

      const response = await fetch("/api/trigger-initial-scrape", {
        method: "POST",
      })

      // First try to parse the response as JSON
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        // If JSON parsing fails, get the text and show it as an error
        const text = await response.text()
        throw new Error(`Failed to parse response: ${text}`)
      }

      if (data.success) {
        setResults(data)

        // Calculate statistics
        const successCount = data.results.filter((r: any) => r.success).length
        const totalCount = data.results.length
        setProgress({ completed: successCount, total: totalCount })
      } else {
        throw new Error(data.message || "Failed to trigger scraper")
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
        <title>Scraper Admin | eggs.live</title>
      </Head>

      <div className="mb-6">
        <Link href="/" className="text-amber-600 hover:text-amber-800">
          ← Back to home
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Scraper Admin</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Trigger Initial Scrape</h2>
        <p className="mb-4">
          This will scrape egg prices from various stores and save them to the database. This process may take several
          minutes.
        </p>

        <button
          onClick={triggerScrape}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Scraping..." : "Start Scrape"}
        </button>

        {progress && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-amber-600 h-2.5 rounded-full"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {progress.completed} of {progress.total} stores successfully scraped (
              {Math.round((progress.completed / progress.total) * 100)}%)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-700 whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Scrape Results</h2>

          <div className="mb-4">
            <h3 className="font-medium text-lg mb-2">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-800">Total Stores</p>
                <p className="text-2xl font-bold text-amber-900">{results.results.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-green-800">Successful</p>
                <p className="text-2xl font-bold text-green-900">
                  {results.results.filter((r: any) => r.success).length}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-sm text-red-800">Failed</p>
                <p className="text-2xl font-bold text-red-900">
                  {results.results.filter((r: any) => !r.success).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[600px]">
            <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

