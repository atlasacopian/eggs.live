"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin } from "lucide-react"

interface EggPrice {
  price: number
  storeName: string
  address: string
  zipCode: string
  date: string
  id: number
  storeLocationId: number
}

interface CheapestEggsProps {
  initialZipCode?: string
}

export function CheapestEggs({ initialZipCode = "" }: CheapestEggsProps) {
  const [zipCode, setZipCode] = useState(initialZipCode)
  const [inputZipCode, setInputZipCode] = useState(initialZipCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cheapestRegular, setCheapestRegular] = useState<EggPrice[]>([])
  const [cheapestOrganic, setCheapestOrganic] = useState<EggPrice[]>([])
  const [activeTab, setActiveTab] = useState<"regular" | "organic">("regular")

  useEffect(() => {
    if (zipCode) {
      fetchCheapestEggs()
    } else {
      // If no zip code, fetch nationwide cheapest
      fetchCheapestEggs()
    }
  }, [zipCode])

  const fetchCheapestEggs = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = zipCode ? `/api/cheapest-eggs?zipCode=${zipCode}` : "/api/cheapest-eggs"

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setCheapestRegular(data.cheapestRegular || [])
        setCheapestOrganic(data.cheapestOrganic || [])
      } else {
        throw new Error(data.message || "Failed to fetch cheapest eggs")
      }
    } catch (err) {
      console.error("Error fetching cheapest eggs:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setZipCode(inputZipCode)
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter ZIP code"
          value={inputZipCode}
          onChange={(e) => setInputZipCode(e.target.value)}
          pattern="[0-9]{5}"
          maxLength={5}
          className="w-32"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      <Tabs defaultValue="regular" onValueChange={(value) => setActiveTab(value as "regular" | "organic")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular">Regular Eggs</TabsTrigger>
          <TabsTrigger value="organic">Organic Eggs</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Finding the cheapest eggs...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchCheapestEggs}>Try Again</Button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">
            {activeTab === "regular" ? "Cheapest Regular Eggs" : "Cheapest Organic Eggs"}
            {zipCode && <span className="text-sm font-normal ml-2">in {zipCode}</span>}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(activeTab === "regular" ? cheapestRegular : cheapestOrganic).length > 0 ? (
              (activeTab === "regular" ? cheapestRegular : cheapestOrganic).map((item, index) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.storeName}</CardTitle>
                      <div className="text-2xl font-bold text-amber-600">{formatPrice(item.price)}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{item.address}</p>
                        <p>ZIP: {item.zipCode}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Updated: {formatDate(item.date)}</div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  No {activeTab} egg prices found {zipCode ? `in ${zipCode}` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

