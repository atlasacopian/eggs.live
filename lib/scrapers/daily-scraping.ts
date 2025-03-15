import { scrapeWithFirecrawl } from "./firecrawl-scraper"
import prisma from "@/lib/prisma"
import { getAllLAStoreLocations, getRepresentativeLAStoreLocations } from "../la-store-locations"

// Update the scrapeAllStores function to use the new store locations:

export async function scrapeAllStores(useAllStores = false) {
  console.log(`Starting LA egg price scraping (${useAllStores ? "all stores" : "representative stores"})...`)

  const results = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get store locations - either all or representative sample
  const storeLocations = useAllStores ? getAllLAStoreLocations() : getRepresentativeLAStoreLocations(10) // Reduced to 10 for testing

  console.log(`Preparing to scrape ${storeLocations.length} store locations...`)

  // Scrape LA stores
  for (const store of storeLocations) {
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
              address: store.address || null,
              zipCode: store.zipCode,
              latitude: store.latitude || null,
              longitude: store.longitude || null,
            },
          })
        }

        // Save each price
        for (const price of storeResults) {
          try {
            await prisma.la_egg_prices.create({
              data: {
                store_location_id: storeLocation.id,
                price: price.price,
                date: today,
                eggType: price.eggType,
                inStock: price.inStock || true, // Add inStock status with default true
              },
            })
          } catch (priceError) {
            console.error(`Error saving price for ${store.name} (${store.zipCode}):`, priceError)
            // Continue with other prices even if one fails
          }
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
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  console.log("LA scraping complete.")
  console.log("Scraping results:")
  console.table(results)
  console.log(
    `LA scraping complete. Successfully scraped ${results.filter((r) => r.success).length} out of ${results.length} stores.`,
  )

  return results
}

