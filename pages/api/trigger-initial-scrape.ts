import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // First, check if we have the required API key
    if (!process.env.FIRECRAWL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "Firecrawl API key not configured",
        message: "Please set up the FIRECRAWL_API_KEY environment variable",
      })
    }

    // Check if we have any existing data
    const existingStores = await prisma.store.count()
    const existingPrices = await prisma.la_egg_prices.count()

    console.log(`Existing data: ${existingStores} stores, ${existingPrices} prices`)

    // Run the scraper
    console.log("Starting initial scrape...")
    const results = await scrapeAllStores(true) // true means scrape all stores, not just a sample

    return res.json({
      success: true,
      message: "Initial scrape completed",
      results,
      existingData: {
        stores: existingStores,
        prices: existingPrices,
      },
    })
  } catch (error) {
    console.error("Error during initial scrape:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to run initial scrape",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

