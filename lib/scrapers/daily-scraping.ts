import { scrapeWithFirecrawl } from "./firecrawl-scraper"
import prisma from "@/lib/prisma"

// Store URLs for scraping
const STORE_URLS = [
  { name: "Food 4 Less", url: "https://www.food4less.com/search?query=eggs&searchType=natural" },
  { name: "Albertsons", url: "https://www.albertsons.com/shop/search-results.html?q=eggs" },
  { name: "H-E-B", url: "https://www.heb.com/search/results?Ntt=eggs" },
  { name: "Meijer", url: "https://www.meijer.com/search.html?text=eggs" },
  { name: "Sprouts", url: "https://shop.sprouts.com/search?search_term=eggs" },
  { name: "Erewhon", url: "https://www.erewhonmarket.com/search?q=eggs" },
  { name: "Food Lion", url: "https://shop.foodlion.com/search?search_term=eggs" },
  { name: "Giant Eagle", url: "https://www.gianteagle.com/search?q=eggs" },
  { name: "Ralphs", url: "https://www.ralphs.com/search?query=eggs" },
  { name: "Shop Rite", url: "https://www.shoprite.com/sm/pickup/rsid/3000/results?q=eggs" },
  { name: "Stop and Shop", url: "https://stopandshop.com/search?searchTerm=eggs" },
  { name: "Vons", url: "https://www.vons.com/shop/search-results.html?q=eggs" },
  { name: "Winn Dixie", url: "https://www.winndixie.com/search?q=eggs" },
  { name: "Weis Markets", url: "https://www.weismarkets.com/search/products/eggs" },
  { name: "Harris Teeter", url: "https://www.harristeeter.com/search?query=eggs" },
]

// Echo Park store URLs
const ECHO_PARK_STORE_URLS = [
  { name: "Food 4 Less", url: "https://www.food4less.com/search?query=eggs&searchType=natural", zipCode: "90026" },
  { name: "Smart & Final", url: "https://www.smartandfinal.com/shop/search-results?q=eggs", zipCode: "90026" },
  { name: "Gelson's", url: "https://www.gelsons.com/shop/search-results.html?q=eggs", zipCode: "90026" },
  { name: "Pavilions", url: "https://www.pavilions.com/shop/search-results.html?q=eggs", zipCode: "90026" },
]

export async function scrapeAllStores() {
  console.log("Starting daily egg price scraping...")

  const results = []

  // Scrape nationwide stores
  for (const store of STORE_URLS) {
    const storeResults = await scrapeWithFirecrawl(store.url, store.name)
    results.push({
      store: store.name,
      count: storeResults.length,
    })
  }

  console.log("Nationwide scraping complete.")

  // Log the results
  console.log("Scraping results:")
  console.table(results)

  return results
}

export async function scrapeEchoParkStores() {
  console.log("Starting Echo Park egg price scraping...")

  const results = []

  // Scrape Echo Park stores
  for (const store of ECHO_PARK_STORE_URLS) {
    // For stores with location-specific pricing, we need to set the zip code
    const storeUrl = store.url + (store.url.includes("?") ? "&" : "?") + `zipCode=${store.zipCode}`

    const storeResults = await scrapeWithFirecrawl(storeUrl, store.name)

    // Save to echo_park_egg_prices table
    if (storeResults.length > 0) {
      // Find or create store location
      let storeLocation = await prisma.store_locations.findFirst({
        where: {
          store: {
            name: store.name,
          },
          zipCode: store.zipCode,
        },
        include: {
          store: true,
        },
      })

      if (!storeLocation) {
        // Find or create the store first
        let storeRecord = await prisma.store.findFirst({
          where: { name: store.name },
        })

        if (!storeRecord) {
          storeRecord = await prisma.store.create({
            data: { name: store.name },
          })
        }

        // Create the store location
        storeLocation = await prisma.store_locations.create({
          data: {
            store_id: storeRecord.id,
            address: `Echo Park / Silver Lake area`,
            zipCode: store.zipCode,
            latitude: 34.0781, // Approximate coordinates for Echo Park
            longitude: -118.2613,
          },
          include: {
            store: true,
          },
        })
      }

      // Get today's date
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Save each price to echo_park_egg_prices
      for (const price of storeResults) {
        await prisma.echo_park_egg_prices.create({
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
      count: storeResults.length,
    })
  }

  console.log("Echo Park scraping complete.")

  // Log the results
  console.log("Echo Park scraping results:")
  console.table(results)

  return results
}

