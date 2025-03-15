import type { EggPrice, StoreLocation } from "./types";
import { scrapeWithFirecrawl } from "./scrapers/firecrawl-scraper";

// Define scraper interface
export interface Scraper {
  name: string;
  description: string;
  scrape: (store: StoreLocation) => Promise<EggPrice[]>;
}

// Export the main scraper function
export async function scrapeStoreForEggPrices(store: StoreLocation): Promise<EggPrice[]> {
  try {
    // For stores with location-specific pricing, we need to set the zip code
    const storeUrl = store.url + (store.url.includes("?") ? "&" : "?") + `zipCode=${store.zipCode}`;
    
    console.log(`Scraping ${store.name} (${store.zipCode})...`);
    return await scrapeWithFirecrawl(storeUrl, store.name);
  } catch (error) {
    console.error(`Error scraping ${store.name} (${store.zipCode}):`, error);
    return [];
  }
}

// Add the getAllScrapers function
export function getAllScrapers(): Scraper[] {
  return [
    {
      name: "firecrawl",
      description: "General purpose web scraper for egg prices",
      scrape: async (store: StoreLocation) => {
        const storeUrl = store.url + (store.url.includes("?") ? "&" : "?") + `zipCode=${store.zipCode}`;
        return await scrapeWithFirecrawl(storeUrl, store.name);
      }
    },
    {
      name: "mock",
      description: "Mock scraper for testing",
      scrape: async (store: StoreLocation) => {
        return generateMockEggPrices(store.name);
      }
    }
  ];
}

// Mock data generator for testing without API keys
export function generateMockEggPrices(storeName: string): EggPrice[] {
  // Base prices
  const basePrices = {
    regular: {
      budget: 3.99,
      standard: 4.49,
      premium: 5.99,
    },
    organic: {
      budget: 5.99,
      standard: 6.99,
      premium: 8.99,
    },
  };

  // Categorize stores
  const premiumStores = ["Erewhon", "Gelson's", "Whole Foods"];
  const budgetStores = ["Food 4 Less", "Smart & Final"];

  // Generate prices for both types
  const prices: EggPrice[] = [];

  // Regular eggs
  let basePrice = premiumStores.some((store) => storeName.includes(store))
    ? basePrices.regular.premium
    : budgetStores.some((store) => storeName.includes(store))
      ? basePrices.regular.budget
      : basePrices.regular.standard;

  const variation = basePrice * 0.2 * (Math.random() - 0.5);
  prices.push({
    price: Math.round((basePrice + variation) * 100) / 100,
    eggType: "regular",
    inStock: Math.random() < 0.9,
  });

  // Organic eggs
  basePrice = premiumStores.some((store) => storeName.includes(store))
    ? basePrices.organic.premium
    : budgetStores.some((store) => storeName.includes(store))
      ? basePrices.organic.budget
      : basePrices.organic.standard;

  const organicVariation = basePrice * 0.2 * (Math.random() - 0.5);
  prices.push({
    price: Math.round((basePrice + organicVariation) * 100) / 100,
    eggType: "organic",
    inStock: Math.random() < 0.8,
  });

  return prices;
}

// Function to get the cheapest egg prices
export async function getCheapestEggPrices() {
  const regularPrices: Array<{
    price: number;
    store: string;
    zipCode: string;
    inStock: boolean;
  }> = [];
  
  const organicPrices: Array<{
    price: number;
    store: string;
    zipCode: string;
    inStock: boolean;
  }> = [];

  // Get all scrapers
  const scrapers = getAllScrapers();
  
  // Default store location to use when scraping
  const defaultStore: StoreLocation = {
    name: "Default Store",
    address: "Default Address",
    zipCode: "90210",
    url: "https://example.com/search?q=eggs"
  };

  // Run each scraper
  for (const scraper of scrapers) {
    try {
      // Pass the default store to the scrape function
      const result = await scraper.scrape(defaultStore);
      
      // Process the results
      if (result && result.length > 0) {
        for (const item of result) {
          if (item.eggType === "regular") {
            regularPrices.push({
              price: item.price,
              store: defaultStore.name,
              zipCode: defaultStore.zipCode,
              inStock: item.inStock || true
            });
          } else if (item.eggType === "organic") {
            organicPrices.push({
              price: item.price,
              store: defaultStore.name,
              zipCode: defaultStore.zipCode,
              inStock: item.inStock || true
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error running scraper ${scraper.name}:`, error);
    }
  }

  // Sort prices from lowest to highest
  regularPrices.sort((a, b) => a.price - b.price);
  organicPrices.sort((a, b) => a.price - b.price);

  return {
    regular: regularPrices.slice(0, 5), // Get top 5 cheapest
    organic: organicPrices.slice(0, 5), // Get top 5 cheapest
  };
}

// Function to get egg prices for a specific ZIP code
export async function getEggPricesByZipCode(zipCode: string) {
  // Implementation would be similar to getCheapestEggPrices
  // but filtered by the provided ZIP code
  
  // For now, we'll return mock data
  const regularPrices = [];
  const organicPrices = [];
  
  // Create mock stores for this ZIP code
  const stores = [
    "Walmart",
    "Target",
    "Whole Foods",
    "Ralphs",
    "Vons",
    "Albertsons",
    "Food 4 Less",
    "Sprouts"
  ];
  
  for (const store of stores) {
    const mockPrices = generateMockEggPrices(store);
    
    for (const price of mockPrices) {
      const priceData = {
        price: price.price,
        store: store,
        zipCode: zipCode,
        inStock: price.inStock || true
      };
      
      if (price.eggType === "regular") {
        regularPrices.push(priceData);
      } else if (price.eggType === "organic") {
        organicPrices.push(priceData);
      }
    }
  }
  
  // Sort prices from lowest to highest
  regularPrices.sort((a, b) => a.price - b.price);
  organicPrices.sort((a, b) => a.price - b.price);
  
  return {
    regular: regularPrices.slice(0, 5), // Get top 5 cheapest
    organic: organicPrices.slice(0, 5), // Get top 5 cheapest
  };
}
