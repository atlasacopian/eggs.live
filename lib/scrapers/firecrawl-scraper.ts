import type { EggPrice } from "../types"
import { FirecrawlClient } from "../firecrawl-client"

// Initialize Firecrawl client
const firecrawlClient = new FirecrawlClient({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
  maxRetries: 2,
  timeout: 60000, // 60 seconds
})

// Store-specific selectors and extraction logic
const storeConfigs: Record<
  string,
  {
    regularEggSelector: string
    organicEggSelector: string
    priceExtractor: (html: string, selector: string) => { price: number; inStock: boolean } | null
  }
> = {
  Walmart: {
    regularEggSelector: '.product-card:contains("Grade A Large Eggs") .price-main',
    organicEggSelector: '.product-card:contains("Organic") .price-main',
    priceExtractor: (html, selector) => {
      // Walmart-specific price extraction logic
      const priceMatch = html.match(new RegExp(`${selector}[^$]*\\$(\\d+\\.\\d+)`))
      const outOfStockIndicator = html.includes("Out of stock") || html.includes("Sold out")

      if (priceMatch && priceMatch[1]) {
        return {
          price: Number.parseFloat(priceMatch[1]),
          inStock: !outOfStockIndicator,
        }
      }
      return null
    },
  },
  Target: {
    regularEggSelector: '[data-test="product-card"]:contains("Grade A Large Eggs") [data-test="current-price"]',
    organicEggSelector: '[data-test="product-card"]:contains("Organic") [data-test="current-price"]',
    priceExtractor: (html, selector) => {
      // Target-specific price extraction logic
      const priceMatch = html.match(new RegExp(`${selector}[^$]*\\$(\\d+\\.\\d+)`))
      const outOfStockIndicator = html.includes("Out of stock") || html.includes("Sold out")

      if (priceMatch && priceMatch[1]) {
        return {
          price: Number.parseFloat(priceMatch[1]),
          inStock: !outOfStockIndicator,
        }
      }
      return null
    },
  },
  // Default config for other stores
  default: {
    regularEggSelector: '.product:contains("eggs"):contains("dozen"):not(:contains("organic")) .price',
    organicEggSelector: '.product:contains("eggs"):contains("organic"):contains("dozen") .price',
    priceExtractor: (html, selector) => {
      // Generic price extraction logic
      const priceMatch = html.match(/\$(\d+\.\d+)/)
      const outOfStockIndicator = html.includes("Out of stock") || html.includes("Sold out")

      if (priceMatch && priceMatch[1]) {
        return {
          price: Number.parseFloat(priceMatch[1]),
          inStock: !outOfStockIndicator,
        }
      }
      return null
    },
  },
}

// Add configurations for other stores as needed
Object.assign(storeConfigs, {
  "Whole Foods": { ...storeConfigs.default },
  Ralphs: { ...storeConfigs.default },
  Vons: { ...storeConfigs.default },
  Albertsons: { ...storeConfigs.default },
  "Food 4 Less": { ...storeConfigs.default },
  Sprouts: { ...storeConfigs.default },
  Erewhon: { ...storeConfigs.default },
  "Gelson's": { ...storeConfigs.default },
  "Smart & Final": { ...storeConfigs.default },
  Pavilions: { ...storeConfigs.default },
})

export async function scrapeWithFirecrawl(url: string, storeName: string): Promise<EggPrice[]> {
  try {
    console.log(`Scraping ${storeName} at ${url}`)

    if (!process.env.FIRECRAWL_API_KEY) {
      console.warn("FIRECRAWL_API_KEY not set. Using mock data instead.")
      return generateMockData(storeName)
    }

    // Get the appropriate config for this store
    const config = storeConfigs[storeName] || storeConfigs.default

    // Use Firecrawl's extract API for structured data extraction
    const extractionSchema = {
      regularEggs: {
        selector: config.regularEggSelector,
        type: "text",
      },
      organicEggs: {
        selector: config.organicEggSelector,
        type: "text",
      },
      outOfStock: {
        selector: "body",
        type: "text",
        regex: "(out of stock|sold out|unavailable)",
        flags: "i",
      },
    }

    // First try using the extraction API
    try {
      const extractionResult = await firecrawlClient.extract(url, extractionSchema, {
        javascript: true,
        proxy: true,
      })

      const prices: EggPrice[] = []

      // Process regular eggs
      if (extractionResult.regularEggs) {
        const priceMatch = extractionResult.regularEggs.match(/\$(\d+\.\d+)/)
        if (priceMatch && priceMatch[1]) {
          prices.push({
            price: Number.parseFloat(priceMatch[1]),
            eggType: "regular",
            inStock: !extractionResult.outOfStock,
          })
        }
      }

      // Process organic eggs
      if (extractionResult.organicEggs) {
        const priceMatch = extractionResult.organicEggs.match(/\$(\d+\.\d+)/)
        if (priceMatch && priceMatch[1]) {
          prices.push({
            price: Number.parseFloat(priceMatch[1]),
            eggType: "organic",
            inStock: !extractionResult.outOfStock,
          })
        }
      }

      if (prices.length > 0) {
        console.log(`Found ${prices.length} prices for ${storeName}:`, prices)
        return prices
      }
    } catch (extractError) {
      console.warn(`Extraction API failed for ${storeName}, falling back to scrape API:`, extractError)
    }

    // Fallback to regular scrape API
    const response = await firecrawlClient.scrape(url, {
      javascript: true,
      waitForSelector: '.price, [data-test="current-price"], .product-price',
      proxy: true,
    })

    if (response.status !== 200) {
      throw new Error(`Failed to scrape ${url}: HTTP ${response.status}`)
    }

    const html = response.content
    const prices: EggPrice[] = []

    // Extract regular egg price
    const regularEggResult = config.priceExtractor(html, config.regularEggSelector)
    if (regularEggResult) {
      prices.push({
        price: regularEggResult.price,
        eggType: "regular",
        inStock: regularEggResult.inStock,
      })
    }

    // Extract organic egg price
    const organicEggResult = config.priceExtractor(html, config.organicEggSelector)
    if (organicEggResult) {
      prices.push({
        price: organicEggResult.price,
        eggType: "organic",
        inStock: organicEggResult.inStock,
      })
    }

    console.log(`Found ${prices.length} prices for ${storeName}:`, prices)
    return prices
  } catch (error) {
    console.error(`Error scraping ${storeName}:`, error)

    // Fallback to mock data if scraping fails
    console.log(`Falling back to mock data for ${storeName}`)
    return generateMockData(storeName)
  }
}

// Helper function to generate mock data when scraping fails or API key is missing
function generateMockData(storeName: string): EggPrice[] {
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

