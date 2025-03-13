import { scrapeWithFirecrawl } from "./firecrawl-scraper"
import prisma from "@/lib/prisma"

// Store URLs for scraping - LA Metro focus
// Added Whole Foods, Target, and Walmart as requested
const LA_STORE_URLS = [
  // Major national chains
  { name: "Walmart", url: "https://www.walmart.com/search?q=eggs", zipCode: "90001" }, // South LA
  { name: "Walmart", url: "https://www.walmart.com/search?q=eggs", zipCode: "91342" }, // San Fernando Valley
  { name: "Target", url: "https://www.target.com/s?searchTerm=eggs", zipCode: "90017" }, // Downtown LA
  { name: "Target", url: "https://www.target.com/s?searchTerm=eggs", zipCode: "91505" }, // Burbank
  { name: "Whole Foods", url: "https://www.wholefoodsmarket.com/search?text=eggs", zipCode: "90046" }, // West Hollywood
  { name: "Whole Foods", url: "https://www.wholefoodsmarket.com/search?text=eggs", zipCode: "90272" }, // Pacific Palisades

  // Regional chains
  { name: "Ralphs", url: "https://www.ralphs.com/search?query=eggs", zipCode: "90026" }, // Echo Park
  { name: "Ralphs", url: "https://www.ralphs.com/search?query=eggs", zipCode: "90045" }, // Westchester
  { name: "Vons", url: "https://www.vons.com/shop/search-results.html?q=eggs", zipCode: "90026" }, // Silver Lake
  { name: "Vons", url: "https://www.vons.com/shop/search-results.html?q=eggs", zipCode: "90036" }, // Mid-Wilshire
  { name: "Albertsons", url: "https://www.albertsons.com/shop/search-results.html?q=eggs", zipCode: "90027" }, // Los Feliz
  { name: "Albertsons", url: "https://www.albertsons.com/shop/search-results.html?q=eggs", zipCode: "91206" }, // Glendale
  { name: "Food 4 Less", url: "https://www.food4less.com/search?query=eggs&searchType=natural", zipCode: "90011" }, // South LA
  { name: "Food 4 Less", url: "https://www.food4less.com/search?query=eggs&searchType=natural", zipCode: "91331" }, // Pacoima

  // Specialty/premium chains
  { name: "Sprouts", url: "https://shop.sprouts.com/search?search_term=eggs", zipCode: "90034" }, // Palms
  { name: "Sprouts", url: "https://shop.sprouts.com/search?search_term=eggs", zipCode: "91604" }, // Studio City
  { name: "Erewhon", url: "https://www.erewhonmarket.com/search?q=eggs", zipCode: "90210" }, // Beverly Hills
  { name: "Erewhon", url: "https://www.erewhonmarket.com/search?q=eggs", zipCode: "90049" }, // Brentwood
  { name: "Gelson's", url: "https://www.gelsons.com/shop/search-results.html?q=eggs", zipCode: "90046" }, // Hollywood
  { name: "Gelson's", url: "https://www.gelsons.com/shop/search-results.html?q=eggs", zipCode: "90077" }, // Bel Air

  // Discount/value chains
  { name: "Smart & Final", url: "https://www.smartandfinal.com/shop/search-results?q=eggs", zipCode: "90026" }, // Echo Park
  { name: "Smart & Final", url: "https://www.smartandfinal.com/shop/search-results?q=eggs", zipCode: "90016" }, // Mid-City
  { name: "Pavilions", url: "https://www.pavilions.com/shop/search-results.html?q=eggs", zipCode: "90064" }, // West LA
  { name: "Pavilions", url: "https://www.pavilions.com/shop/search-results.html?q=eggs", zipCode: "91604" }, // Studio City
]

export async function scrapeAllStores() {
  console.log("Starting LA egg price scraping...")

  const results = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Scrape LA stores
  for (const store of LA_STORE_URLS) {
    try {
      // For stores with location-specific pricing, we need to set the zip code
      const storeUrl = store.url + (store.url.includes("?") ? "&" : "?") + `zipCode=${store.zipCode}`

      console.log(`Scraping ${store.name} (${store.zipCode})...`)
      const storeResults = await scrapeWithFirecrawl(storeUrl, store.name)

      // Save results to database
      if (storeResults.length > 0) {
        // Find or create the store
        let storeRecord = await prisma.store.findFirst({
          where: { name: store.name },
        })

        if (!storeRecord) {
          storeRecord = await prisma.store.create({
            data: {
              name: store.name,
              website: store.url.split("/").slice(0, 3).join("/"),
            },
          })
        }

        // Find or create the store location
        let storeLocation = await prisma.store_locations.findFirst({
          where: {
            store_id: storeRecord.id,
            zipCode: store.zipCode,
          },
        })

        if (!storeLocation) {
          storeLocation = await prisma.store_locations.create({
            data: {
              store_id: storeRecord.id,
              address: `Los Angeles area (${store.zipCode})`,
              zipCode: store.zipCode,
              latitude: null, // We could add actual coordinates later
              longitude: null,
            },
          })
        }

        // Save each price
        for (const price of storeResults) {
          await prisma.la_egg_prices.create({
            data: {
              store_location_id: storeLocation.id,
              price: price.price,
              date: today,
              eggType: price.eggType,
            },
          })
        }
      }

      results.push({
        store: store.name,
        zipCode: store.zipCode,
        count: storeResults.length,
        success: true,
      })
    } catch (error) {
      console.error(`Error scraping ${store.name} (${store.zipCode}):`, error)
      results.push({
        store: store.name,
        zipCode: store.zipCode,
        count: 0,
        success: false,
        error: error.message,
      })
    }
  }

  console.log("LA scraping complete.")
  console.log("Scraping results:")
  console.table(results)

  return results
}

