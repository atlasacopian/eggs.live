// lib/scrapers/index.ts
// Main export file for the egg price scraping system

// Export the scheduler functions
export { scheduleDailyScraping, manualTriggerScraping } from './scheduler';

// Export the base scraper
export { scrapeStore } from './base-scraper';
export type { ScraperResult } from './base-scraper';

// Export retailer-specific scrapers
export { scrapeWalmartEggs } from './walmart-scraper';
export { scrapeKrogerEggs } from './kroger-scraper';
export { scrapeTargetEggs } from './target-scraper';
export { scrapeCostcoEggs } from './costco-scraper';
export { scrapeWholeFoodsEggs } from './whole-foods-scraper';
export { scrapeTraderJoesEggs } from './trader-joes-scraper';
export { scrapeAldiEggs } from './aldi-scraper';

// Export utility functions
export { isMatchingEggProduct, eggScraperConfig } from './egg-scraper';

// Legacy function for backward compatibility
export async function scrapeEggPrices() {
  console.log('Legacy scrapeEggPrices function called, redirecting to scheduleDailyScraping');
  const { scheduleDailyScraping } = await import('./scheduler');
  return scheduleDailyScraping();
}

// Export store coverage and egg type configurations
export { storeLocations, scrapingConfig } from '../store-coverage';
export { eggTypes, retailerProductMap } from '../egg-types';

// Export price history data
export { usdaHistoricalData } from '../price-history';
