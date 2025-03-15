"use client"

import type React from "react"

import Head from "next/head"
import { useState } from "react"
import { useRouter } from "next/router"

export default function HomePage() {
  const [zipCode, setZipCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    router.push(`/results?zipCode=${zipCode}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Head>
        <title>eggs.live - Real-time Egg Price Tracker</title>
        <meta name="description" content="Find the cheapest egg prices near you" />
      </Head>

      <main className="container mx-auto px-4">
        <div className="min-h-screen flex flex-col items-center justify-center max-w-md mx-auto -mt-32">
          {/* Logo and Title */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl font-bold tracking-tight">eggs.live</h1>
            <p className="text-gray-600 text-lg">real-time egg price tracker</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                pattern="[0-9]{5}"
                maxLength={5}
                className="w-full h-14 px-4 rounded-lg border border-gray-200 text-lg text-center focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-black text-white rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Find Eggs Near Me"}
            </button>
          </form>

          {/* Stats */}
          <div className="mt-16 text-center space-y-2">
            <p className="text-gray-600">Tracking prices at 24+ stores</p>
            <p className="text-gray-500 text-sm">Updated daily</p>
          </div>
        </div>
      </main>
    </div>
  )
}

