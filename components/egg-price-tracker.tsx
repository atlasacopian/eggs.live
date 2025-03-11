"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="space-y-4">
      <Tabs defaultValue="nationwide" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nationwide">Nationwide</TabsTrigger>
          <TabsTrigger value="echo-park">Echo Park / Silver Lake</TabsTrigger>
        </TabsList>

        <TabsContent value="nationwide" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average {selectedEggType === "organic" ? "Organic" : "Regular"} Egg Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CurrentPrice price={averagePrice} />
                <CardDescription>Based on {validPrices.length} stores nationwide</CardDescription>
              </CardContent>
            </Card>

            {featuredStores.slice(0, 3).map((store) => (
              <Card key={store.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{store.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CurrentPrice price={store.price || 0} />
                  <CardDescription>
                    <a
                      href={store.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Visit website
                    </a>
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Egg Price History</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <EggPriceChart eggType={selectedEggType} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Egg Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => setSelectedEggType("regular")}
                    className={`p-4 rounded-lg border ${
                      selectedEggType === "regular"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="font-medium">Regular Eggs</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Conventional, non-organic eggs</div>
                  </button>

                  <button
                    onClick={() => setSelectedEggType("organic")}
                    className={`p-4 rounded-lg border ${
                      selectedEggType === "organic"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="font-medium">Organic Eggs</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">USDA certified organic eggs</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Stores</CardTitle>
              <CardDescription>
                Current {selectedEggType === "organic" ? "organic" : "regular"} egg prices from stores across the US
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading store data...</div>
              ) : error ? (
                <div className="text-center text-red-500 py-4">{error}</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sortedStores.map((store) => (
                    <div key={store.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{store.name}</div>
                        <a
                          href={store.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Visit website
                        </a>
                      </div>
                      <div className="text-xl font-bold">${store.price?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="echo-park" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Echo Park Average {selectedEggType === "organic" ? "Organic" : "Regular"} Egg Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CurrentPrice price={echoAvgPrice} />
                <CardDescription>Based on {echoStores.length} stores in Echo Park/Silver Lake</CardDescription>
              </CardContent>
            </Card>

            {formattedEchoStores.slice(0, 3).map((store) => (
              <Card key={`${store.id}-${store.name}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{store.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CurrentPrice price={store.price || 0} />
                  <CardDescription>
                    <a
                      href={store.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Visit website
                    </a>
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Echo Park / Silver Lake Stores</CardTitle>
              <CardDescription>
                Current {selectedEggType === "organic" ? "organic" : "regular"} egg prices in the Echo Park area
              </CardDescription>
            </CardHeader>
            <CardContent>
              {echoLoading ? (
                <div className="text-center py-4">Loading Echo Park data...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {formattedEchoStores.map((store) => (
                    <div
                      key={`${store.id}-${store.name}`}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{store.name}</div>
                        <a
                          href={store.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Visit website
                        </a>
                      </div>
                      <div className="text-xl font-bold">${store.price?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Egg Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => setSelectedEggType("regular")}
                    className={`p-4 rounded-lg border ${
                      selectedEggType === "regular"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="font-medium">Regular Eggs</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Conventional, non-organic eggs</div>
                  </button>

                  <button
                    onClick={() => setSelectedEggType("organic")}
                    className={`p-4 rounded-lg border ${
                      selectedEggType === "organic"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="font-medium">Organic Eggs</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">USDA certified organic eggs</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

