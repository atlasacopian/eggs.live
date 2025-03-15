import type { EggPrice } from "../types"

export async function scrapeWithFirecrawl(url: string, storeName: string): Promise<EggPrice[]> {
  try {
    console.log(`Scraping ${storeName} at ${url}`)

    // For testing purposes, let's generate realistic test data
    // In production, this would be replaced with actual web scraping logic
    const prices: EggPrice[] = []

    // Generate regular egg prices
    prices.push({
      price: generateRealisticPrice(storeName, "regular"),
      eggType: "regular",
      inStock: generateRealisticStockStatus(storeName, "regular"),
    })

    // Generate organic egg prices
    prices.push({
      price: generateRealisticPrice(storeName, "organic"),
      eggType: "organic",
      inStock: generateRealisticStockStatus(storeName, "organic"),
    })

    console.log(`Found ${prices.length} prices for ${storeName}:`, prices)
    return prices
  } catch (error) {
    console.error(`Error scraping ${storeName}:`, error)
    throw error
  }
}

// Helper function to generate realistic prices based on store type
function generateRealisticPrice(storeName: string, eggType: string): number {
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

  // Determine base price based on store category
  let basePrice
  if (premiumStores.some((store) => storeName.includes(store))) {
    basePrice = basePrices[eggType].premium
  } else if (budgetStores.some((store) => storeName.includes(store))) {
    basePrice = basePrices[eggType].budget
  } else {
    basePrice = basePrices[eggType].standard
  }

  // Add some random variation (±20%)
  const variation = basePrice * 0.2 * (Math.random() - 0.5)
  const finalPrice = basePrice + variation

  // Round to 2 decimal places
  return Math.round(finalPrice * 100) / 100
}

// New helper function to generate realistic stock status
function generateRealisticStockStatus(storeName: string, eggType: string): boolean {
  // Simulate some stores being out of stock
  // In reality, this would be determined by scraping the store website

  // Base probability of being in stock (90%)
  let inStockProbability = 0.9

  // Adjust probability based on store type and egg type
  if (eggType === "organic" && !storeName.includes("Whole Foods")) {
    // Organic eggs less likely to be in stock at non-specialty stores
    inStockProbability -= 0.2
  }

  // Simulate current egg shortage for some budget stores
  if (storeName.includes("Food 4 Less") || storeName.includes("Smart & Final")) {
    inStockProbability -= 0.3
  }

  // Random determination based on probability
  return Math.random() < inStockProbability
}

