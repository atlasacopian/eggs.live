import type { EggPrice } from "@prisma/client"
import prisma from "@/lib/prisma"

interface FirecrawlResponse {
  data: {
    prices?: {
      store: string
      price: number
      eggType: string
      unit: string
    }[]
  }
}

export async function scrapeWithFirecrawl(storeUrl: string, storeName: string): Promise<EggPrice[]> {
  try {
    console.log(`Scraping ${storeName} at ${storeUrl} with Firecrawl...`)

    // Firecrawl API key should be set in environment variables
    const apiKey = process.env.FIRECRAWL_API_KEY

    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is not set")
    }

    // Create a custom extraction prompt for egg prices
    const extractionPrompt = `
      Extract all egg prices from this page. For each egg product, provide:
      1. The price (just the number, e.g. 3.99)
      2. The egg type (regular or organic)
      3. The unit (dozen, half-dozen, etc.)
      
      Return the data in this format:
      {
        "prices": [
          {
            "store": "${storeName}",
            "price": 3.99,
            "eggType": "regular",
            "unit": "dozen"
          }
        ]
      }
      
      Only include chicken eggs, not duck or other types. Only include whole eggs, not egg whites or other egg products.
    `

    // Call Firecrawl API
    const response = await fetch("https://api.firecrawl.dev/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: storeUrl,
        prompt: extractionPrompt,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Firecrawl API error (${response.status}): ${errorText}`)
    }

    const result: FirecrawlResponse = await response.json()

    if (!result.data || !result.data.prices || result.data.prices.length === 0) {
      console.log(`No egg prices found for ${storeName}`)
      return []
    }

    // Find or create the store in the database
    let store = await prisma.store.findFirst({
      where: { name: storeName },
    })

    if (!store) {
      store = await prisma.store.create({
        data: { name: storeName },
      })
    }

    // Process the extracted prices
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const eggPrices: EggPrice[] = []

    for (const item of result.data.prices) {
      // Only process dozen eggs for consistency
      if (item.unit.toLowerCase().includes("dozen")) {
        // Convert to price per dozen if needed
        let pricePerDozen = item.price
        if (item.unit.toLowerCase().includes("half")) {
          pricePerDozen = item.price * 2
        } else if (item.unit.toLowerCase().includes("18")) {
          pricePerDozen = (item.price / 18) * 12
        }

        const eggPrice = await prisma.egg_prices.create({
          data: {
            store_id: store.id,
            price: pricePerDozen,
            date: today,
            eggType: item.eggType.toLowerCase() === "organic" ? "organic" : "regular",
          },
        })

        eggPrices.push(eggPrice)
      }
    }

    console.log(`Successfully scraped ${eggPrices.length} egg prices from ${storeName}`)
    return eggPrices
  } catch (error) {
    console.error(`Error scraping ${storeName}:`, error)
    return []
  }
}

