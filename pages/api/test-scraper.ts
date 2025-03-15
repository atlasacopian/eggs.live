import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeWithFirecrawl } from "@/lib/scrapers/firecrawl-scraper"
import { formatStoreUrlWithZipCode } from "@/lib/utils/zip-code"
import { storeExistsInZipCode, getNearbyZipCodesWithStore } from "@/lib/utils/store-validation"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { url, storeName, zipCode } = req.query
    const radiusMiles = 10 // Search within 10 miles

    if (!url || !storeName || Array.isArray(url) || Array.isArray(storeName) || !zipCode || Array.isArray(zipCode)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid parameters. Store name, URL, and ZIP code are required.",
      })
    }

    // Check if the store exists in this ZIP code or within radius
    if (!storeExistsInZipCode(storeName, zipCode, radiusMiles)) {
      // Get nearby ZIP codes with this store
      const nearbyStores = getNearbyZipCodesWithStore(storeName, zipCode, radiusMiles)

      return res.status(404).json({
        success: false,
        error: `No ${storeName} found within ${radiusMiles} miles of ZIP code ${zipCode}`,
        nearbyLocations: nearbyStores.map((store) => ({
          zipCode: store.zipCode,
          distance: Math.round(store.distance * 10) / 10, // Round to 1 decimal place
        })),
        message: "Try these nearby locations instead",
      })
    }

    // Format the URL with the correct ZIP code parameter
    const formattedUrl = formatStoreUrlWithZipCode(url, storeName, zipCode)

    // Test the scraper with the provided URL and store name
    const { prices, locationVerified, formFilled, actualLocation } = await scrapeWithFirecrawl(
      formattedUrl,
      storeName,
      zipCode,
    )

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
      formFilled,
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

