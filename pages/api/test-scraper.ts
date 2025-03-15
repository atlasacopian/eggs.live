import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeWithFirecrawl } from "@/lib/scrapers/firecrawl-scraper"
import { formatStoreUrlWithZipCode } from "@/lib/utils/zip-code"
import { storeExistsInZipCode, getNearbyZipCodesWithStore } from "@/lib/utils/store-validation"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get URL and store name from query parameters
    const { url, storeName, zipCode } = req.query

    if (!url || !storeName || Array.isArray(url) || Array.isArray(storeName) || !zipCode || Array.isArray(zipCode)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid parameters. Store name, URL, and ZIP code are required.",
      })
    }

    // Check if the store exists in this ZIP code
    if (!storeExistsInZipCode(storeName, zipCode)) {
      // Get nearby ZIP codes with this store
      const nearbyZipCodes = getNearbyZipCodesWithStore(storeName, zipCode)

      return res.status(404).json({
        success: false,
        error: `No ${storeName} found in ZIP code ${zipCode}`,
        nearbyZipCodes,
        message: "Try these nearby ZIP codes instead",
      })
    }

    // Format the URL with the correct ZIP code parameter
    const formattedUrl = formatStoreUrlWithZipCode(url, storeName, zipCode)

    // Test the scraper with the provided URL and store name
    const { prices, locationVerified, actualLocation } = await scrapeWithFirecrawl(formattedUrl, storeName, zipCode)

    // If the location couldn't be verified, return an error
    if (!locationVerified) {
      return res.status(400).json({
        success: false,
        error: `Could not verify prices for ${storeName} in ZIP code ${zipCode}`,
        actualLocation,
        message: "The website may have redirected to a different store location",
      })
    }

    return res.status(200).json({
      success: true,
      url: formattedUrl,
      storeName,
      zipCode,
      locationVerified,
      location: actualLocation,
      results: prices,
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

