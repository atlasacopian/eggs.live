"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface LAPriceData {
  laAverage: number
  chainAverages: Array<{
    chain: string
    avgPrice: number
    storeCount: number
    lowestPrice: number
  }>
  prices: Array<{
    id: number
    store: string
    zipCode: string
    address: string
    price: number
    date: string
  }>
  chains: string[]
}

export function LAPrices() {
  const [priceData, setPriceData] = useState<LAPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eggType, setEggType] = useState<"regular" | "organic">("regular")
  const [selectedChain, setSelectedChain] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLAPrices() {
      try {
        setLoading(true)

        const url = `/api/la-prices?eggType=${eggType}`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch LA prices")
        }

        const data = await response.json()
        setPriceData(data)
      } catch (err) {
        console.error("Error fetching LA prices:", err)
        setError("Failed to load price data")
      } finally {
        setLoading(false)
      }
    }

    fetchLAPrices()
  }, [eggType])

  const formatPrice = (price: number) => {
    return price ? `$${price.toFixed(2)}` : "$0.00"
  }

  // Filter prices by selected chain
  const filteredPrices = selectedChain ? priceData?.prices.filter((p) => p.store === selectedChain) : priceData?.prices

  return (
    <div className="space-y-6">
      <Tabs defaultValue="regular" onValueChange={(value) => setEggType(value as "regular" | "organic")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular">Regular Eggs</TabsTrigger>
          <TabsTrigger value="organic">Organic Eggs</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center py-8">Loading Los Angeles egg prices...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">LA Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(priceData?.laAverage || 0)}</div>
                <p className="text-xs text-muted-foreground">Based on {priceData?.prices.length || 0} stores</p>
              </CardContent>
            </Card>

            {priceData?.chainAverages.slice(0, 3).map((chain) => (
              <Card key={chain.chain}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{chain.chain}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(chain.avgPrice)}</div>
                  <p className="text-xs text-muted-foreground">
                    Lowest: {formatPrice(chain.lowestPrice)} ({chain.storeCount} stores)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grocery Chains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant={selectedChain === null ? "default" : "outline"} onClick={() => setSelectedChain(null)}>
                  All Chains
                </Button>

                {priceData?.chains.map((chain) => (
                  <Button
                    key={chain}
                    variant={selectedChain === chain ? "default" : "outline"}
                    onClick={() => setSelectedChain(chain)}
                  >
                    {chain}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Prices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-muted/50 p-3 text-sm font-medium">
                  <div className="col-span-4">Store</div>
                  <div className="col-span-5">Location</div>
                  <div className="col-span-3 text-right">Price</div>
                </div>
                <div className="divide-y">
                  {filteredPrices?.map((store) => (
                    <div key={store.id} className="grid grid-cols-12 p-3 text-sm">
                      <div className="col-span-4 font-medium">{store.store}</div>
                      <div className="col-span-5 text-muted-foreground">{store.zipCode}</div>
                      <div className="col-span-3 text-right font-medium">{formatPrice(store.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

