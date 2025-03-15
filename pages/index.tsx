"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/router"
import { CheapestEggs } from "@/components/cheapest-eggs"

export default function HomePage() {
  const [zipCode, setZipCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Navigate to results page with the zip code
      router.push(`/results?zipCode=${zipCode}`)
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4">
      <main className="w-full max-w-4xl space-y-12">
        <div className="text-center space-y-2 mt-8">
          <h1 className="text-4xl font-bold">eggs.live</h1>
          <p className="text-gray-600">real-time egg price tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <Input
            type="text"
            placeholder="Enter your zip code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            pattern="[0-9]{5}"
            maxLength={5}
            className="text-center text-lg"
            required
          />
          <Button type="submit" disabled={loading} className="w-full bg-black text-white hover:bg-gray-800">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Find Eggs Near Me"}
          </Button>
        </form>

        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-center mb-6">Today's Cheapest Eggs</h2>
          <CheapestEggs />
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm">Tracking prices at 24+ stores</p>
          <p className="text-sm text-gray-500">Updated daily</p>
        </div>
      </main>
    </div>
  )
}

