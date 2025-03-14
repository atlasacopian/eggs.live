"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Store } from "lucide-react"

interface StoreData {
  name: string
  address: string
  regularPrice: number | null
  organicPrice: number | null
  inStock: boolean
  distance?: number
  lastUpdated?: string
}

interface StoreCardProps {
  store: StoreData
  showDistance?: boolean
  showLastUpdated?: boolean
}

export function StoreCard({ store, showDistance = false, showLastUpdated = false }: StoreCardProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A"
    return `$${price.toFixed(2)}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          {store.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{store.address}</p>
        {showDistance && store.distance && (
          <p className="text-sm text-muted-foreground">{store.distance.toFixed(1)} miles away</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Regular Eggs:</span>
            <span className="font-medium">{formatPrice(store.regularPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span>Organic Eggs:</span>
            <span className="font-medium">{formatPrice(store.organicPrice)}</span>
          </div>
          <div className={`text-sm ${store.inStock ? "text-green-600" : "text-red-600"}`}>
            {store.inStock ? "In Stock" : "Out of Stock"}
          </div>
          {showLastUpdated && store.lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(store.lastUpdated).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

