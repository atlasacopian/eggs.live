import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeWithFirecrawl } from "@/lib/scrapers/firecrawl-scraper"
import { formatStoreUrlWithZipCode } from "@/lib/utils/zip-code"
import { validateStoreLocation, getStoreLocation, getNearbyStores } from "@/lib/utils/store-validation"

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

    // Validate store location if ZIP code is provided
    if (zipCode && !Array.isArray(zipCode)) {
      const storeExists = validateStoreLocation(storeName, zipCode)

      if (!storeExists) {
        // Get nearby stores
        const nearbyStores = getNearbyStores(zipCode)
          .filter((store) => store.name === storeName)
          .map((store) => ({
            name: store.name,
            address: store.address,
            zipCode: store.zipCode,
            distance: "Nearby", // In a real implementation, calculate actual distance
          }))

        return res.status(404).json({
          success: false,
          error: `No ${storeName} found in ZIP code ${zipCode}`,
          nearbyLocations: nearbyStores,
          message: "Try searching these nearby locations instead",
        })
      }

      // Get the specific store location
      const location = getStoreLocation(storeName, zipCode)

      // Ensure the URL includes the ZIP code
      const testUrl = formatStoreUrlWithZipCode(url, storeName, zipCode)

      // Test the scraper with the provided URL and store name
      const results = await scrapeWithFirecrawl(testUrl, storeName)

      return res.status(200).json({
        success: true,
        url: testUrl,
        storeName,
        location,
        results,
        usingMock: !process.env.FIRECRAWL_API_KEY,
      })
    }

    // If no ZIP code provided, return an error
    return res.status(400).json({
      success: false,
      error: "ZIP code is required to check store availability",
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

