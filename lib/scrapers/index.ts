import { scrapeWithFirecrawl } from "./firecrawl-scraper"
import type { EggPrice } from "../types"

// Define scraper interface with updated signature
export interface Scraper {
  scrape(url: string, storeName: string, zipCode?: string): Promise<EggPrice[]>
}

// Export the scrapeWithFirecrawl function
export { scrapeWithFirecrawl }

// Export the default scraper with adapter function
export const defaultScraper: Scraper = {
  scrape: async (url: string, storeName: string, zipCode?: string) => {
    // If zipCode is not provided, try to extract it from the URL
    const effectiveZipCode = zipCode || extractZipCodeFromUrl(url) || "90210" // Default to 90210 if no ZIP code found

    // Call the enhanced scraper with the ZIP code
    const result = await scrapeWithFirecrawl(url, storeName, effectiveZipCode)

    // Return just the prices array to maintain compatibility
    return result.prices
  },
}

// Helper function to extract ZIP code from URL
function extractZipCodeFromUrl(url: string): string | null {
  const zipCodeMatch = url.match(
    /[?&](zipCode|zipcode|zip|postal_code|postalCode|location|locationId|storeZipCode)=(\d{5})/i,
  )
  return zipCodeMatch ? zipCodeMatch[2] : null
}

