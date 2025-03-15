import { scrapeWithFirecrawl } from "./firecrawl-scraper"
import type { EggPrice } from "../types"

// Define scraper interface
export interface Scraper {
  scrape(url: string, storeName: string): Promise<EggPrice[]>
}

// Export the scrapeWithFirecrawl function
export { scrapeWithFirecrawl }

// Export the default scraper
export const defaultScraper: Scraper = {
  scrape: scrapeWithFirecrawl,
}

