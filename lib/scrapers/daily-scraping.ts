import { scrapeWithFirecrawl } from "./firecrawl-scraper"
import { PrismaClient } from "@prisma/client"
import { getAllLAStoreLocations, getRepresentativeLAStoreLocations } from "../la-store-locations"

// Update the scrapeAllStores function to use the new store locations:

export async function scrapeAllStores(useAllStores = false) {
  console.log(`Starting LA egg price scraping (${useAllStores ? "all stores" : "representative stores"})...`)

  const results = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get store locations - either all or representative sample
  const storeLocations = useAllStores ? getAllLAStoreLocations() : getRepresentativeLAStoreLocations(50)

  console.log(`Preparing to scrape ${storeLocations.length} store locations...`)

  // Process stores sequentially to avoid connection issues
  for (const store of storeLocations) {
    // Create a new Prisma client for each store to avoid prepared statement conflicts
    const prisma = new PrismaClient()

    try {
      // Format the URL with the correct ZIP code parameter based on the store
      const storeUrl = formatStoreUrlWithZipCode(store.url, store.name, store.zipCode)

      console.log(`Scraping ${store.name} (${store.zipCode}) at URL: ${storeUrl}...`)
      const storeResults = await scrapeWithFirecrawl(storeUrl, store.name)

      // Save results to database
      if (storeResults.length > 0) {
        // Find or create the store - removed website field
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
              address: store.address || `${store.name} (${store.zipCode})`,
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
      }

      results.push({
        store: store.name,
        zipCode: store.zipCode,
        url: storeUrl, // Include the URL in the results for debugging
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

// Helper function to format store URLs with the correct ZIP code parameter
function formatStoreUrlWithZipCode(baseUrl: string, storeName: string, zipCode: string): string {
  // Default approach - append zipCode parameter
  let url = baseUrl

  // Store-specific URL formatting
  switch (storeName) {
    // Major national chains
    case "Walmart":
      // Walmart uses 'zipCode' parameter
      if (!url.includes("zipCode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
      }
      break

    case "Target":
      // Target uses 'zipcode' parameter (lowercase 'c')
      if (!url.includes("zipcode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
      }
      break

    case "Whole Foods":
      // Whole Foods uses 'location' parameter
      if (!url.includes("location=")) {
        url += (url.includes("?") ? "&" : "?") + `location=${zipCode}`
      }
      break

    case "Costco":
      // Costco uses 'zipCode' parameter
      if (!url.includes("zipCode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
      }
      break

    case "Sam's Club":
      // Sam's Club uses 'postalCode' parameter
      if (!url.includes("postalCode=")) {
        url += (url.includes("?") ? "&" : "?") + `postalCode=${zipCode}`
      }
      break

    // Kroger-owned stores
    case "Ralphs":
    case "Food 4 Less":
    case "Harris Teeter":
      // Kroger-owned stores use 'locationId' parameter
      if (!url.includes("locationId=")) {
        url += (url.includes("?") ? "&" : "?") + `locationId=${zipCode}`
      }
      break

    // Albertsons Companies stores
    case "Albertsons":
    case "Vons":
    case "Pavilions":
    case "Safeway":
      // Albertsons Companies stores use 'zipcode' parameter
      if (!url.includes("zipcode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
      }
      break

    // Other major chains
    case "Sprouts":
      // Sprouts uses 'postal_code' parameter
      if (!url.includes("postal_code=")) {
        url += (url.includes("?") ? "&" : "?") + `postal_code=${zipCode}`
      }
      break

    case "H-E-B":
      // H-E-B uses 'zip' parameter
      if (!url.includes("zip=")) {
        url += (url.includes("?") ? "&" : "?") + `zip=${zipCode}`
      }
      break

    case "Meijer":
      // Meijer uses 'zipCode' parameter
      if (!url.includes("zipCode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
      }
      break

    case "Food Lion":
      // Food Lion uses 'zipcode' parameter
      if (!url.includes("zipcode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
      }
      break

    case "Giant Eagle":
      // Giant Eagle uses 'zip' parameter
      if (!url.includes("zip=")) {
        url += (url.includes("?") ? "&" : "?") + `zip=${zipCode}`
      }
      break

    case "Shop Rite":
    case "ShopRite":
      // ShopRite uses 'storeZipCode' parameter
      if (!url.includes("storeZipCode=")) {
        url += (url.includes("?") ? "&" : "?") + `storeZipCode=${zipCode}`
      }
      break

    case "Stop and Shop":
    case "Stop & Shop":
      // Stop & Shop uses 'zipcode' parameter
      if (!url.includes("zipcode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
      }
      break

    case "Winn Dixie":
    case "Winn-Dixie":
      // Winn-Dixie uses 'zipCode' parameter
      if (!url.includes("zipCode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
      }
      break

    case "Weis Markets":
      // Weis Markets uses 'zip' parameter
      if (!url.includes("zip=")) {
        url += (url.includes("?") ? "&" : "?") + `zip=${zipCode}`
      }
      break

    // Specialty/regional stores
    case "Erewhon":
      // Erewhon uses 'postalCode' parameter
      if (!url.includes("postalCode=")) {
        url += (url.includes("?") ? "&" : "?") + `postalCode=${zipCode}`
      }
      break

    case "Gelson's":
      // Gelson's uses 'zip' parameter
      if (!url.includes("zip=")) {
        url += (url.includes("?") ? "&" : "?") + `zip=${zipCode}`
      }
      break

    case "Smart & Final":
      // Smart & Final uses 'zipcode' parameter
      if (!url.includes("zipcode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
      }
      break

    case "Trader Joe's":
      // Trader Joe's uses 'zip' parameter
      if (!url.includes("zip=")) {
        url += (url.includes("?") ? "&" : "?") + `zip=${zipCode}`
      }
      break

    default:
      // For other stores, try the most common format
      if (!url.includes("zipCode=") && !url.includes("zipcode=") && !url.includes("zip=")) {
        url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
      }
      break
  }

  return url
}

