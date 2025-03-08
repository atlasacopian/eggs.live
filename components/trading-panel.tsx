"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

export function TradingPanel() {
  const [eggType, setEggType] = useState("LRG-W")
  const [quantity, setQuantity] = useState("10")
  const [orderType, setOrderType] = useState("market")
  const [limitPrice, setLimitPrice] = useState("3.45")

  const eggTypes = [
    { id: "LRG-W", name: "Large White (LRG-W)", price: 3.42, change: 0.08, changePercent: 2.4 },
    { id: "LRG-B", name: "Large Brown (LRG-B)", price: 3.78, change: -0.05, changePercent: -1.3 },
    { id: "ORG", name: "Organic (ORG)", price: 5.89, change: 0.21, changePercent: 3.7 },
    { id: "FR", name: "Free Range (FR)", price: 5.12, change: 0.03, changePercent: 0.6 },
  ]

  const selectedEgg = eggTypes.find((egg) => egg.id === eggType) || eggTypes[0]
  const totalCost = Number.parseFloat(quantity) * selectedEgg.price

  const handleTrade = (action) => {
    alert(
      `${action} order placed for ${quantity} dozen ${selectedEgg.name} eggs at $${selectedEgg.price.toFixed(2)} per dozen. Total: $${totalCost.toFixed(2)}`,
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Trade Eggs</CardTitle>
        <CardDescription>Buy and sell eggs on the market</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">{selectedEgg.name}</div>
            <div className={`flex items-center ${selectedEgg.change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {selectedEgg.change === 0 ? (
                <Minus className="h-4 w-4 mr-1 text-gray-500" />
              ) : selectedEgg.change > 0 ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
              )}
              <span className="font-medium">${selectedEgg.price.toFixed(2)}</span>
              <span className="text-xs ml-1">
                {selectedEgg.change >= 0 ? "+" : ""}
                {selectedEgg.changePercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <Select value={eggType} onValueChange={setEggType}>
            <SelectTrigger>
              <SelectValue placeholder="Select egg type" />
            </SelectTrigger>
            <SelectContent>
              {eggTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} - ${type.price.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Quantity (dozen)</label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Order Type</label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orderType === "limit" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Limit Price ($)</label>
                <Input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} step="0.01" />
              </div>
            )}

            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Estimated Cost:</span>
                <span className="font-medium">${totalCost.toFixed(2)}</span>
              </div>
              <Button className="w-full" onClick={() => handleTrade("Buy")}>
                Buy {quantity} Dozen
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Quantity (dozen)</label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Order Type</label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orderType === "limit" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Limit Price ($)</label>
                <Input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} step="0.01" />
              </div>
            )}

            <div className="pt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Estimated Value:</span>
                <span className="font-medium">${totalCost.toFixed(2)}</span>
              </div>
              <Button variant="destructive" className="w-full" onClick={() => handleTrade("Sell")}>
                Sell {quantity} Dozen
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4 text-xs text-muted-foreground">
        Market hours: 8:00 AM - 4:00 PM EST, Mon-Fri
      </CardFooter>
    </Card>
  )
}

