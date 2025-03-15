import { scrapeWithFirecrawl } from "./firecrawl-scraper"
import type { EggPrice, StoreLocation } from "../types"

// Export the main scraper function
export async function scrapeStoreForEggPrices(store: StoreLocation): Promise<EggPrice[]> {
  try {
    // For stores with location-specific pricing, we need to set the zip code
    const storeUrl = store.url + (store.url.includes("?") ? "&" : "?") + `zipCode=${store.zipCode}`
    
    console.log(`Scraping ${store.name} (${store.zipCode})...`)
    return await scrapeWithFirecrawl(storeUrl, store.name)
  } catch (error) {
    console.error(`Error scraping ${store.name} (${store.zipCode}):`, error)
    return []
  }
}

// Export other scraper-related functions
export { scrapeWithFirecrawl } from "./firecrawl-scraper"

// Mock data generator for testing without API keys
export function generateMockEggPrices(storeName: string): EggPrice[] {
  // Base prices
  const basePrices = {
    regular: {
      budget: 3.99,
      standard: 4.49,
      premium: 5.99,
    },
    organic: {
      budget: 5.99,
      standard: 6.99,
      premium: 8.99,
    },
  }

  // Categorize stores
  const premiumStores = ["Erewhon", "Gelson's", "Whole Foods"]
  const budgetStores = ["Food 4 Less", "Smart & Final"]

  // Generate prices for both types
  const prices: EggPrice[] = []

  // Regular eggs
  let basePrice = premiumStores.some((store) => storeName.includes(store))
    ? basePrices.regular.premium
    : budgetStores.some((store) => storeName.includes(store))
      ? basePrices.regular.budget
      : basePrices.regular.standard

  const variation = basePrice * 0.2 * (Math.random() - 0.5)
  prices.push({
    price: Math.round((basePrice + variation) * 100) / 100,
    eggType: "regular",
    inStock: Math.random() < 0.9,
  })

  // Organic eggs
  basePrice = premiumStores.some((store) => storeName.includes(store))
    ? basePrices.organic.premium
    : budgetStores.some((store) => storeName.includes(store))
      ? basePrices.organic.budget
      : basePrices.organic.standard

  const organicVariation = basePrice * 0.2 * (Math.random() - 0.5)
  prices.push({
    price: Math.round((basePrice + organicVariation) * 100) / 100,
    eggType: "organic",
    inStock: Math.random() < 0.8,
  })

  return prices
}
