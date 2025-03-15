import type { EggPrice } from "./types"

// Mock FirecrawlClient class
export class FirecrawlClient {
  private apiKey: string
  private maxRetries: number
  private timeout: number

  constructor(options: { apiKey: string; maxRetries?: number; timeout?: number }) {
    this.apiKey = options.apiKey
    this.maxRetries = options.maxRetries || 3
    this.timeout = options.timeout || 30000
  }

  async scrape(url: string, options?: any): Promise<{ status: number; content: string }> {
    console.log(`Mocked scrape for URL: ${url}`)
    return {
      status: 200,
      content: "<html><body>Mocked HTML content</body></html>",
    }
  }

  async extract(url: string, schema: any, options?: any): Promise<any> {
    console.log(`Mocked extract for URL: ${url}`)
    return {
      regularEggs: "$4.99",
      organicEggs: "$6.99",
      outOfStock: false,
    }
  }
}

// Mock function to simulate scraping
export async function scrapeWithFirecrawl(url: string, storeName: string): Promise<EggPrice[]> {
  console.log(`Mock scraping ${storeName} at ${url}`)

  // Generate mock data based on store name
  const prices: EggPrice[] = []

  // Regular eggs
  prices.push({
    price: 3.99 + Math.random() * 2,
    eggType: "regular",
    inStock: Math.random() > 0.2, // 80% chance of being in stock
  })

  // Organic eggs
  prices.push({
    price: 5.99 + Math.random() * 3,
    eggType: "organic",
    inStock: Math.random() > 0.3, // 70% chance of being in stock
  })

  return prices
}

