// Update types.ts to include all type definitions
export interface EggPrice {
  price: number
  eggType: string
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

export interface PriceData {
  id: number
  price: number
  date: string
  storeLocationId: number
  eggType: string
}

export interface StoreData {
  id: number
  name: string
  website?: string
  locations: StoreLocation[]
}

export interface MarketStats {
  nationalAverage: number
  chainAverages: ChainAverage[]
  priceCount: number
  lastUpdated: string
}

export interface ChainAverage {
  chain: string
  average: number
  count: number
}

