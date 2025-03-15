declare module "@/lib/types" {
  export type EggType = "regular" | "organic"

  export interface EggPrice {
    price: number
    eggType: EggType | string
    inStock?: boolean
    date?: string
    store?: string
    storeLocation?: string
    zipCode?: string
    isOnSale?: boolean
  }

  export interface StoreLocation {
    name: string
    address: string
    zipCode: string
    url: string
    latitude?: number
    longitude?: number
  }

  export interface ScrapingResult {
    store: string
    zipCode: string
    count: number
    success: boolean
    error?: string
  }

  // Add other interfaces as needed
}

