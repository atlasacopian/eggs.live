"use client"

import { useState } from "react"
import Head from "next/head"
import Link from "next/link"

export default function ScraperAdminPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const triggerScrape = async () => {
    try {
      setLoading(true)
      setError(null)
      setResults(null)

      const response = await fetch("/api/trigger-initial-scrape", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.message || "Failed to trigger scraper")
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Scrape Results</h2>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[600px]">
            <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

