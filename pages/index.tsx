"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const [zipCode, setZipCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      window.location.href = `/results?zipCode=${zipCode}`
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">eggs.live</h1>
          <p className="text-gray-600">real-time egg price tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find Eggs"}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-sm">Tracking prices at 24+ stores</p>
          <p className="text-sm text-gray-500">Updated daily</p>
        </div>
      </main>
    </div>
  )
}

