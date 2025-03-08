"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function ZipCodeSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [zipCode, setZipCode] = useState(searchParams.get("zipCode") || "")
  const [error, setError] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()

    // Basic ZIP code validation
    if (!zipCode.match(/^\d{5}$/)) {
      setError("Please enter a valid 5-digit ZIP code")
      return
    }

    setError("")

    // Update URL with the ZIP code parameter
    const params = new URLSearchParams(searchParams)
    params.set("zipCode", zipCode)
    router.push(`?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Location</CardTitle>
        <CardDescription>Enter your ZIP code to see local prices</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className={error ? "border-red-500" : ""}
              maxLength={5}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

