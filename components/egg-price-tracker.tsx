"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EggPriceChart } from "./egg-price-chart"
import { CurrentPrice } from "./current-price"

interface Store {
  id: string
  name: string
  website: string
}

interface Price {
  id: string
  storeId: string
  price: number
  date: string
  eggType: string
}

interface StoreWithPrice extends Store {
  price: number | null
}

export function EggPriceTracker() {
  const [stores, setStores] = useState<Store[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEggType, setSelectedEggType] = useState<string>("regular")
  const [echoStores, setEchoStores] = useState<any[]>([])
  const [echoAverages, setEchoAverages] = useState<any[]>([])
  const [echoLoading, setEchoLoading] = useState(true)

  // Fetch stores and prices
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch stores
        const storesResponse = await fetch("/api/stores")
        const storesData = await storesResponse.json()

        if (!storesData.success) {
          throw new Error(storesData.error || "Failed to fetch stores")
        }

        // Fetch prices
        const pricesResponse = await fetch(`/api/prices?eggType=${selectedEggType}`)
        const pricesData = await pricesResponse.json()

        if (!pricesData.success) {
          throw new Error(pricesData.error || "Failed to fetch prices")
        }

        // Fetch Echo Park prices
        const echoResponse = await fetch(`/api/echo-park-prices?eggType=${selectedEggType}`)
        const echoData = await echoResponse.json()

        if (echoData.success) {
          setEchoStores(echoData.prices || [])
          setEchoAverages(echoData.averages || [])
        }

        setStores(storesData.stores)
        setPrices(pricesData.prices)
        setError(null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load egg price data. Please try again later.")
      } finally {
        setLoading(false)
        setEchoLoading(false)
      }
    }

    fetchData()
  }, [selectedEggType])

  // Combine stores with their prices
  const storesWithPrices: StoreWithPrice[] = stores
    .map((store) => {
      const price = prices.find((p) => p.storeId === store.id)
      return {
        ...store,
        price: price ? price.price : null,
      }
    })
    .filter((store) => store.price !== null) // Only show stores with prices

  // Sort stores by price (lowest first)
  const sortedStores = [...storesWithPrices].sort((a, b) => {
    if (a.price === null) return 1
    if (b.price === null) return -1
    return a.price - b.price
  })

  // Calculate average price
  const validPrices = prices.filter((p) => p.price !== null && p.price > 0).map((p) => p.price)
  const averagePrice =
    validPrices.length > 0 ? validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0

  // Get Echo Park average for the selected egg type
  const echoAverage = echoAverages.find((avg) => avg.eggType === selectedEggType)
  const echoAvgPrice = echoAverage ? echoAverage.avgPrice : 0

  // Format the Echo Park stores for display
  const formattedEchoStores = echoStores
    .map((store) => ({
      id: store.storeId,
      name: `${store.store_name} (${store.location})`,
      price: store.price,
      website: store.store_website,
    }))
    .sort((a, b) => a.price - b.price)

  // Featured stores - make sure to include our new stores if they have data
  const featuredStoreIds = [
    "albertsons",
    "food4less", // Replaced Trader Joe's with Food 4 Less
    "ralphs",
    "vons",
    "smartfinal", // Added Smart & Final
    "erewhon", // Added Erewhon
  ]

  const featuredStores = sortedStores.filter((store) => featuredStoreIds.includes(store.id))

  return (
    <div className="space-y-8">
      <Tabs defaultValue="nationwide" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="nationwide" className="egg-tab px-8 py-3 text-lg">
            Nationwide
          </TabsTrigger>
          <TabsTrigger value="echo-park" className="egg-tab px-8 py-3 text-lg">
            Echo Park / Silver Lake
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nationwide">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="price-card">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium mb-2">
                  Average {selectedEggType === "organic" ? "Organic" : "Regular"} Price
                </h3>
                <CurrentPrice price={averagePrice} />
                <p className="text-sm text-gray-500 mt-2">Based on {validPrices.length} stores</p>
              </CardContent>
            </Card>

            {featuredStores.slice(0, 3).map((store) => (
              <Card key={store.id} className="price-card">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium mb-2">{store.name}</h3>
                  <CurrentPrice price={store.price || 0} />
                  <a
                    href={store.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-black hover:underline mt-2 inline-block"
                  >
                    Visit website →
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 mt-8 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Price History</h3>
                <EggPriceChart eggType={selectedEggType} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">Egg Type</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedEggType("regular")}
                    className={`egg-type-button w-full p-4 rounded-lg border transition-all ${
                      selectedEggType === "regular" ? "selected" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">Regular Eggs</div>
                    <div className="text-sm text-gray-500 mt-1">Conventional, non-organic eggs</div>
                  </button>

                  <button
                    onClick={() => setSelectedEggType("organic")}
                    className={`egg-type-button w-full p-4 rounded-lg border transition-all ${
                      selectedEggType === "organic" ? "selected" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">Organic Eggs</div>
                    <div className="text-sm text-gray-500 mt-1">USDA certified organic eggs</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">All Stores</h3>
              <p className="text-sm text-gray-500 mb-6">
                Current {selectedEggType === "organic" ? "organic" : "regular"} egg prices nationwide
              </p>

              {loading ? (
                <div className="text-center py-8">Loading store data...</div>
              ) : error ? (
                <div className="text-center text-red-500 py-8">{error}</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sortedStores.map((store) => (
                    <div key={store.id} className="price-card p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{store.name}</div>
                          <a
                            href={store.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-black hover:underline"
                          >
                            Visit website →
                          </a>
                        </div>
                        <div className="text-xl font-bold">${store.price?.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="echo-park">
          {/* Similar structure as nationwide tab, but with Echo Park specific data */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="price-card">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium mb-2">
                  Echo Park Average {selectedEggType === "organic" ? "Organic" : "Regular"} Price
                </h3>
                <CurrentPrice price={echoAvgPrice} />
                <p className="text-sm text-gray-500 mt-2">Based on {echoStores.length} local stores</p>
              </CardContent>
            </Card>

            {formattedEchoStores.slice(0, 3).map((store) => (
              <Card key={`${store.id}-${store.name}`} className="price-card">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium mb-2">{store.name}</h3>
                  <CurrentPrice price={store.price || 0} />
                  <a
                    href={store.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-black hover:underline mt-2 inline-block"
                  >
                    Visit website →
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Echo Park / Silver Lake Stores</h3>
              <p className="text-sm text-gray-500 mb-6">
                Current {selectedEggType === "organic" ? "organic" : "regular"} egg prices in the area
              </p>

              {echoLoading ? (
                <div className="text-center py-8">Loading Echo Park data...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {formattedEchoStores.map((store) => (
                    <div key={`${store.id}-${store.name}`} className="price-card p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{store.name}</div>
                          <a
                            href={store.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-black hover:underline"
                          >
                            Visit website →
                          </a>
                        </div>
                        <div className="text-xl font-bold">${store.price?.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

