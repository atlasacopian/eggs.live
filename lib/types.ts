// Consolidated type definitions with standardization for egg types and quantities

// Enum for egg types to ensure consistency
export enum EggType {
  Regular = "regular",
  Organic = "organic",
}

// Interface for egg price data - always for a dozen eggs
export interface EggPrice {
  price: number // Price for a dozen eggs
  eggType: EggType // Either "regular" or "organic"
  date?: string // Date of the price data
  store?: string // Store name
  storeLocation?: string // Store location
  zipCode?: string // Store zip code
  isOnSale?: boolean // Whether the eggs are on sale

  // Explicitly note that all prices are for a dozen eggs
  readonly quantity: 12 // Always a dozen eggs
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
  price: number // Price for a dozen eggs
  date: string
  storeLocationId: number
  eggType: EggType // Either "regular" or "organic"
}

export interface StoreData {
  id: number
  name: string
  website?: string
  locations: StoreLocation[]
  regularPrice?: number // Price for a dozen regular eggs
  organicPrice?: number // Price for a dozen organic eggs
}

export interface MarketStats {
  nationalAverage: {
    [EggType.Regular]: number // Average price for a dozen regular eggs
    [EggType.Organic]: number // Average price for a dozen organic eggs
  }
  chainAverages: ChainAverage[]
  priceCount: number
  lastUpdated: string
}

export interface ChainAverage {
  chain: string
  average: {
    [EggType.Regular]: number // Average price for a dozen regular eggs
    [EggType.Organic]: number // Average price for a dozen organic eggs
  }
  count: number
}

export interface EggPriceStats {
  averagePrice: number // Average price for a dozen eggs
  minPrice: number // Minimum price for a dozen eggs
  maxPrice: number // Maximum price for a dozen eggs
  medianPrice: number // Median price for a dozen eggs
  priceCount: number
  lastUpdated: string
  eggType: EggType // Either "regular" or "organic"
}

export interface EggPriceHistory {
  dates: string[]
  prices: number[] // Prices for a dozen eggs
  eggType: EggType // Either "regular" or "organic"
  store?: string
}

// Helper function to ensure price is for a dozen eggs
export function standardizeEggPrice(price: number, quantity: number): number {
  if (quantity === 12) return price
  return (price / quantity) * 12 // Convert to price per dozen
}

// Helper function to validate egg type
export function isValidEggType(type: string): type is EggType {
  return type === EggType.Regular || type === EggType.Organic
}

