"use client"

import { useState } from "react"
import { useStoreData } from "@/hooks/use-store-data"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function StoreList() {
  const [eggType, setEggType] = useState("regular")
  const { stores, isLoading } = useStoreData(eggType)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name") // "name", "price", "change"
  const [sortOrder, setSortOrder] = useState("asc") // "asc", "desc"

  if (isLoading) {
    return (
      <div className="space-y-4 font-mono uppercase">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-gray-900 h-16 border border-gray-800"></div>
        ))}
      </div>
    )
  }

  // Filter stores based on search term
  const filteredStores = stores.filter((store) => store.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Sort stores based on sort criteria
  const sortedStores = [...filteredStores].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (sortBy === "price") {
      return sortOrder === "asc" ? a.price - b.price : b.price - a.price
    } else if (sortBy === "change") {
      return sortOrder === "asc" ? a.change - b.change : b.change - a.change
    }
    return 0
  })

  // Toggle sort order
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  return (
    <div className="space-y-3 font-mono uppercase">
      {/* Egg type selector */}
      <div className="flex space-x-2 mb-4">
        <Button
          variant={eggType === "regular" ? "default" : "outline"}
          size="sm"
          onClick={() => setEggType("regular")}
          className="text-xs"
        >
          REGULAR
        </Button>
        <Button
          variant={eggType === "organic" ? "default" : "outline"}
          size="sm"
          onClick={() => setEggType("organic")}
          className="text-xs"
        >
          ORGANIC
        </Button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="SEARCH STORES..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black border border-gray-700 p-2 text-white font-mono uppercase focus:outline-none focus:border-white"
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400 px-2 py-1 border-b border-gray-700">
        <button
          onClick={() => toggleSort("name")}
          className={cn("flex items-center", sortBy === "name" ? "text-white" : "")}
        >
          STORE {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
        </button>
        <button
          onClick={() => toggleSort("price")}
          className={cn("flex items-center", sortBy === "price" ? "text-white" : "")}
        >
          PRICE {sortBy === "price" && (sortOrder === "asc" ? "▲" : "▼")}
        </button>
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-1">
        {sortedStores.map((store) => (
          <div key={store.id} className="bg-black border border-gray-700 p-3 mb-2">
            <div className="flex justify-between items-center">
              <div className="font-medium">{store.name.toUpperCase()}</div>
              <div className="text-lg font-bold">${store.price.toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-gray-400">
                UPDATED: {new Date(store.lastUpdated).toLocaleDateString().toUpperCase()}
              </div>
              <div
                className={cn(
                  "flex items-center text-xs font-medium",
                  store.change >= 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {store.change >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {store.change >= 0 ? "+" : ""}
                {store.change.toFixed(2)} ({store.change >= 0 ? "+" : ""}
                {store.changePercent.toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

