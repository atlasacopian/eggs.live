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
    if (zipCode && !Array.isArray(zipCode)) {
      // Use the appropriate parameter name based on the store
      const store = storeName.toString()
      let zipParam = "zipCode" // Default

      // Determine the correct parameter based on the store
      if (
        [
          "Target",
          "Albertsons",
          "Vons",
          "Pavilions",
          "Safeway",
          "Food Lion",
          "Stop and Shop",
          "Stop & Shop",
          "Smart & Final",
        ].includes(store)
      ) {
        zipParam = "zipcode"
      } else if (store === "Whole Foods") {
        zipParam = "location"
      } else if (["Ralphs", "Food 4 Less", "Harris Teeter"].includes(store)) {
        zipParam = "locationId"
      } else if (store === "Sprouts") {
        zipParam = "postal_code"
      } else if (["Sam's Club", "Erewhon"].includes(store)) {
        zipParam = "postalCode"
      } else if (["H-E-B", "Giant Eagle", "Weis Markets", "Gelson's", "Trader Joe's"].includes(store)) {
        zipParam = "zip"
      } else if (["Shop Rite", "ShopRite"].includes(store)) {
        zipParam = "storeZipCode"
      }

      // Only add the parameter if it's not already in the URL
      if (!testUrl.includes(`${zipParam}=`)) {
        testUrl += (testUrl.includes("?") ? "&" : "?") + `${zipParam}=${zipCode}`
      }
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

