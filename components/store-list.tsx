"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface Store {
  id: number
  name: string
  price: number
  date: string
}

export default function StoreList({
  location = "nationwide",
  eggType = "regular",
}: {
  location?: "nationwide" | "echo-park"
  eggType?: "regular" | "organic"
}) {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStores() {
      try {
        setLoading(true)
        const endpoint = location === "nationwide" ? "/api/stores" : "/api/echo-park-prices"

        const response = await fetch(`${endpoint}?eggType=${eggType}`)

        if (!response.ok) {
          throw new Error("Failed to fetch store data")
        }

        const data = await response.json()
        setStores(data.stores || [])
      } catch (err) {
        console.error("Error fetching stores:", err)
        setError("Failed to load store data")
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [location, eggType])

  if (loading) return <p>Loading store data...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (stores.length === 0) return <p>No store data available for {eggType} eggs.</p>

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stores.map((store) => (
        <Card key={store.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{store.name}</h3>
              <p className="font-bold">${store.price.toFixed(2)}</p>
            </div>
            <p className="text-sm text-gray-500">Last updated: {new Date(store.date).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

