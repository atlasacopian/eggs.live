import { scrapeWithFirecrawl } from "./firecrawl-scraper"
import { PrismaClient } from "@prisma/client"
import { getAllLAStoreLocations, getRepresentativeLAStoreLocations } from "../la-store-locations"
import { formatStoreUrlWithZipCode } from "../utils/zip-code"
import { storeExistsInZipCode } from "../utils/store-validation"

// Update the scrapeAllStores function to use the enhanced scraper:

export async function scrapeAllStores(useAllStores = false) {
  console.log(`Starting LA egg price scraping (${useAllStores ? "all stores" : "representative stores"})...`)

  const results = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get store locations - either all or representative sample
  const storeLocations = useAllStores ? getAllLAStoreLocations() : getRepresentativeLAStoreLocations(50)

  // Filter out store locations that don't exist
  const validStoreLocations = storeLocations.filter((store) => storeExistsInZipCode(store.name, store.zipCode))

  console.log(
    `Preparing to scrape ${validStoreLocations.length} valid store locations out of ${storeLocations.length} total...`,
  )

  // Process stores sequentially to avoid connection issues
  for (const store of validStoreLocations) {
    // Create a new Prisma client for each store to avoid prepared statement conflicts
    const prisma = new PrismaClient()

    try {
      // Format the URL with the correct ZIP code parameter based on the store
      const storeUrl = formatStoreUrlWithZipCode(store.url, store.name, store.zipCode)

      console.log(`Scraping ${store.name} (${store.zipCode}) at URL: ${storeUrl}...`)
      const {
        prices: storeResults,
        locationVerified,
        actualLocation,
      } = await scrapeWithFirecrawl(storeUrl, store.name, store.zipCode)

      // Only save results if the location was verified
      if (locationVerified && storeResults.length > 0) {
        // Find or create the store
        let storeRecord = await prisma.store.findFirst({
          where: { name: store.name },
        })

        if (!storeRecord) {
          storeRecord = await prisma.store.create({
            data: {
              name: store.name,
            },
          })
        }

        // Find or create the store location
        let storeLocation = await prisma.store_locations.findFirst({
          where: {
            store_id: storeRecord.id,
            zipcode: store.zipCode,
          },
        })

        if (!storeLocation) {
          storeLocation = await prisma.store_locations.create({
            data: {
              store_id: storeRecord.id,
              address: actualLocation?.address || store.address || `${store.name} (${store.zipCode})`,
              zipcode: store.zipCode,
              latitude: store.latitude || null,
              longitude: store.longitude || null,
            },
          })
        }

        // Save each price
        for (const price of storeResults) {
          try {
            // Check for existing price record for this store location, date, and egg type
            const existingPrice = await prisma.la_egg_prices.findFirst({
              where: {
                store_location_id: storeLocation.id,
                date: today,
                eggType: price.eggType,
              },
            })

            if (existingPrice) {
              // Update existing price
              await prisma.la_egg_prices.update({
                where: { id: existingPrice.id },
                data: {
                  price: price.price,
                  inStock: price.inStock || true,
                },
              })
            } else {
              // Create new price record
              await prisma.la_egg_prices.create({
                data: {
                  store_location_id: storeLocation.id,
                  price: price.price,
                  date: today,
                  eggType: price.eggType,
                  inStock: price.inStock || true,
                },
              })
            }
          } catch (priceError) {
            console.error(`Error saving price for ${store.name} (${store.zipCode}):`, priceError)
            // Continue with other prices even if one fails
          }
        }

        results.push({
          store: store.name,
          zipCode: store.zipCode,
          url: storeUrl,
          count: storeResults.length,
          locationVerified,
          success: true,
        })
      } else {
        results.push({
          store: store.name,
          zipCode: store.zipCode,
          url: storeUrl,
          count: 0,
          locationVerified,
          success: false,
          error: "Location could not be verified",
        })
      }
    } catch (error) {
      console.error(`Error scraping ${store.name} (${store.zipCode}):`, error)
      results.push({
        store: store.name,
        zipCode: store.zipCode,
        count: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      // Always disconnect the Prisma client to free up resources
      await prisma.$disconnect()
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

