import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeWithFirecrawl } from "@/lib/scrapers/firecrawl-scraper"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get URL and store name from query parameters
    const { url, storeName } = req.query

    if (!url || !storeName || Array.isArray(url) || Array.isArray(storeName)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid 'url' or 'storeName' parameter",
      })
    }

    // Test the scraper with the provided URL and store name
    const results = await scrapeWithFirecrawl(url, storeName)

    return res.status(200).json({
      success: true,
      url,
      storeName,
      results,
      usingMock: !process.env.FIRECRAWL_API_KEY,
    })
  } catch (error) {
    console.error("Error testing scraper:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to test scraper",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

