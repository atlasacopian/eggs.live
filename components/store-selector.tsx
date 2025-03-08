"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const stores = [
  { id: "all", name: "All Stores" },
  { id: "kroger", name: "Kroger" },
  { id: "wholeFoods", name: "Whole Foods" },
  { id: "walmart", name: "Walmart" },
  { id: "target", name: "Target" },
]

export function StoreSelector() {
  const [open, setOpen] = useState(false)
  const [selectedStores, setSelectedStores] = useState(["all"])

  const toggleStore = (storeId: string) => {
    if (storeId === "all") {
      setSelectedStores(["all"])
      return
    }

    let newSelection = [...selectedStores].filter((id) => id !== "all")

    if (newSelection.includes(storeId)) {
      newSelection = newSelection.filter((id) => id !== storeId)
    } else {
      newSelection.push(storeId)
    }

    if (newSelection.length === 0 || newSelection.length === stores.length - 1) {
      setSelectedStores(["all"])
    } else {
      setSelectedStores(newSelection)
    }
  }

  const displayValue = () => {
    if (selectedStores.includes("all")) return "All Stores"
    return selectedStores.map((id) => stores.find((store) => store.id === id)?.name).join(", ")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Store Filter</CardTitle>
        <CardDescription>Select stores to compare</CardDescription>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
              {displayValue()}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search stores..." />
              <CommandList>
                <CommandEmpty>No store found.</CommandEmpty>
                <CommandGroup>
                  {stores.map((store) => (
                    <CommandItem key={store.id} value={store.id} onSelect={() => toggleStore(store.id)}>
                      <Check
                        className={cn("mr-2 h-4 w-4", selectedStores.includes(store.id) ? "opacity-100" : "opacity-0")}
                      />
                      {store.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  )
}

