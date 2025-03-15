import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeWithFirecrawl } from "@/lib/scrapers/firecrawl-scraper"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get URL and store name from query parameters
    const { url, storeName, zipCode } = req.query

    if (!url || !storeName || Array.isArray(url) || Array.isArray(storeName)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid 'url' or 'storeName' parameter",
      })
    }

    // Ensure the URL includes the ZIP code if provided
    let testUrl = url
    if (zipCode && !url.includes("zipCode=") && !url.includes("zipcode=")) {
      // Use the appropriate parameter name based on the store
      let zipParam = "zipCode"

      if (storeName === "Target") {
        zipParam = "zipcode"
      } else if (storeName === "Whole Foods") {
        zipParam = "location"
      } else if (["Ralphs", "Vons", "Albertsons", "Food 4 Less", "Pavilions"].includes(storeName)) {
        zipParam = "locationId"
      } else if (storeName === "Sprouts") {
        zipParam = "postal_code"
      }

      testUrl += (url.includes("?") ? "&" : "?") + `${zipParam}=${zipCode}`
    }

    // Test the scraper with the provided URL and store name
    const results = await scrapeWithFirecrawl(testUrl, storeName)

    return res.status(200).json({
      success: true,
      url: testUrl,
      storeName,
      zipCode: zipCode || "Not specified (using default location)",
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

