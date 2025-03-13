"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/router"

export function EggSearch() {
  const [zipCode, setZipCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Navigate to results page with the zip code
    router.push({
      pathname: "/results",
      query: { zipCode },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="relative">
        {/* Egg shape container */}
        <div className="egg-shape relative flex items-center justify-center">
          <form onSubmit={handleSubmit} className="absolute z-10 flex flex-col items-center">
            <p className="text-lg font-medium mb-2 text-center">Enter your ZIP code</p>
            <div className="flex flex-col items-center gap-4">
              <Input
                type="text"
                placeholder="90210"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                pattern="[0-9]{5}"
                maxLength={5}
                className="w-32 text-center text-xl font-bold"
                required
              />
              <Button type="submit" disabled={loading} className="rounded-full px-8">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Find Eggs"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .egg-shape {
          width: 280px;
          height: 380px;
          background-color: #fff9e6;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(0deg);
          position: relative;
          overflow: hidden;
        }
        
        .egg-shape::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), transparent);
          border-radius: 50% 50% 0 0 / 60% 60% 0 0;
        }
      `}</style>
    </div>
  )
}

