// Update the EggPrice interface to include inStock

export type EggType = "regular" | "organic"

export interface EggPrice {
  price: number // Price for a dozen eggs
  eggType: EggType // Either "regular" or "organic"
  inStock: boolean // Whether the eggs are in stock
  date?: string // Date of the price data
  store?: string // Store name
  storeLocation?: string // Store location
  zipCode?: string // Store zip code
  isOnSale?: boolean // Whether the eggs are on sale

  // Explicitly note that all prices are for a dozen eggs
  readonly quantity: 12 // Always a dozen eggs
}

