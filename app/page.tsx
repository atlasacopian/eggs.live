"use client"

import { useState } from "react"
import CurrentPrice from "@/components/current-price"
import PriceHistory from "@/components/price-history"
import StoreList from "@/components/store-list"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [location, setLocation] = useState<"nationwide" | "echo-park">("nationwide")
  const [eggType, setEggType] = useState<"regular" | "organic">("regular")

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">eggs.live</h1>
        <p className="text-xl">Real-time egg prices across the US and Echo Park, Los Angeles</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 mb-6">
          <Button variant={location === "nationwide" ? "default" : "outline"} onClick={() => setLocation("nationwide")}>
            Nationwide
          </Button>
          <Button variant={location === "echo-park" ? "default" : "outline"} onClick={() => setLocation("echo-park")}>
            Echo Park / Silver Lake
          </Button>
        </div>

        <CurrentPrice eggType={eggType} />

        <PriceHistory eggType={eggType} />

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Egg Type</h2>
          <div className="flex space-x-2">
            <Button
              variant={eggType === "regular" ? "default" : "outline"}
              onClick={() => setEggType("regular")}
              className="flex-1 py-6"
            >
              <div>
                <div className="font-bold">Regular Eggs</div>
                <div className="text-sm">Conventional, non-organic eggs</div>
              </div>
            </Button>
            <Button
              variant={eggType === "organic" ? "default" : "outline"}
              onClick={() => setEggType("organic")}
              className="flex-1 py-6"
            >
              <div>
                <div className="font-bold">Organic Eggs</div>
                <div className="text-sm">USDA certified organic eggs</div>
              </div>
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">All Stores</h2>
          <p className="mb-4">
            Current {eggType} egg prices {location === "nationwide" ? "nationwide" : "in Echo Park"}
          </p>
          <StoreList location={location} eggType={eggType} />
        </div>
      </div>

      <footer className="text-sm text-gray-500 mt-12">© 2025 eggs.live - All prices are for a dozen eggs</footer>
    </main>
  )
}

