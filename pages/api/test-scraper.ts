import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeWithFirecrawl } from "@/lib/scrapers/firecrawl-scraper"
import { formatStoreUrlWithZipCode } from "@/lib/utils/zip-code"
import { isStoreInZipCode, getStoreLocation, getNearbyStores } from "@/lib/data/store-locations"

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
    if (!isStoreInZipCode(storeName, zipCode)) {
      // Get nearby store locations
      const nearbyLocations = getNearbyStores(storeName, zipCode)

      return res.status(404).json({
        success: false,
        error: `No ${storeName} found in ZIP code ${zipCode}`,
        nearbyLocations: nearbyLocations.map((loc) => ({
          name: loc.name,
          address: loc.address,
          zipCode: loc.zipCode,
          distance: "Nearby", // In a real implementation, calculate actual distance
        })),
        message: "Try these nearby locations instead",
      })
    }

    // Get the specific store location
    const location = getStoreLocation(storeName, zipCode)

    // Format the URL with the correct ZIP code parameter
    const formattedUrl = formatStoreUrlWithZipCode(url, storeName, zipCode)

    // Test the scraper with the provided URL and store name
    const results = await scrapeWithFirecrawl(formattedUrl, storeName)

    return res.status(200).json({
      success: true,
      url: formattedUrl,
      storeName,
      zipCode,
      location,
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

