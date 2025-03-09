import { getAllScrapers } from "./index"
import { prisma } from "../db"

// Interface for scraper results
interface ScraperResult {
  storeName: string
  storeId: string
  regularPrice: number | null
  organicPrice: number | null
  timestamp: Date
}

/**
 * Run all scrapers and collect results
 */
export async function runScrapers(): Promise<ScraperResult[]> {
  console.log("Starting egg price scraping...")
  const scrapers = getAllScrapers()
  const results: ScraperResult[] = []

  // Run all scrapers in parallel
  const scraperPromises = scrapers.map(async (scraper) => {
    try {
      const result = await scraper.scrape()

      // Only add results if at least one price was found
      if (result.regular !== null || result.organic !== null) {
        results.push({
          storeName: scraper.name,
          storeId: scraper.name.toLowerCase().replace(/\s+/g, "-"),
          regularPrice: result.regular,
          organicPrice: result.organic,
          timestamp: new Date(),
        })
      }
    } catch (error) {
      console.error(`Error scraping ${scraper.name}:`, error)
    }
  })

  // Wait for all scrapers to complete
  await Promise.all(scraperPromises)

  console.log(`Scraping completed. Found prices for ${results.length} stores.`)
  return results
}

/**
 * Save scraper results to the database
 */
export async function saveResults(results: ScraperResult[]): Promise<void> {
  console.log("Saving results to database...")
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Process each result
  for (const result of results) {
    // Save regular egg price if available
    if (result.regularPrice !== null) {
      await prisma.eggPrice.create({
        data: {
          storeId: result.storeId,
          price: result.regularPrice,
          eggType: "regular",
          date: today,
        },
      })
    }

    // Save organic egg price if available
    if (result.organicPrice !== null) {
      await prisma.eggPrice.create({
        data: {
          storeId: result.storeId,
          price: result.organicPrice,
          eggType: "organic",
          date: today,
        },
      })
    }
  }

  // Calculate and save average prices
  await calculateAverages(today)

  console.log("Results saved successfully")
}

/**
 * Calculate average prices for a given date
 */
async function calculateAverages(date: Date): Promise<void> {
  // Calculate regular egg average
  const regularPrices = await prisma.eggPrice.findMany({
    where: {
      date,
      eggType: "regular",
    },
  })

  if (regularPrices.length > 0) {
    const totalRegularPrice = regularPrices.reduce((sum, price) => sum + price.price, 0)
    const averageRegularPrice = totalRegularPrice / regularPrices.length

    await prisma.averagePrice.upsert({
      where: {
        date_eggType: {
          date,
          eggType: "regular",
        },
      },
      update: {
        price: averageRegularPrice,
        storeCount: regularPrices.length,
      },
      create: {
        date,
        eggType: "regular",
        price: averageRegularPrice,
        storeCount: regularPrices.length,
      },
    })
  }

  // Calculate organic egg average
  const organicPrices = await prisma.eggPrice.findMany({
    where: {
      date,
      eggType: "organic",
    },
  })

  if (organicPrices.length > 0) {
    const totalOrganicPrice = organicPrices.reduce((sum, price) => sum + price.price, 0)
    const averageOrganicPrice = totalOrganicPrice / organicPrices.length

    await prisma.averagePrice.upsert({
      where: {
        date_eggType: {
          date,
          eggType: "organic",
        },
      },
      update: {
        price: averageOrganicPrice,
        storeCount: organicPrices.length,
      },
      create: {
        date,
        eggType: "organic",
        price: averageOrganicPrice,
        storeCount: organicPrices.length,
      },
    })
  }
}

/**
 * Main function to schedule and run scrapers
 */
export async function scheduleScrapers(): Promise<ScraperResult[]> {
  try {
    // Run scrapers and get results
    const results = await runScrapers()

    // Save results to database
    if (results.length > 0) {
      await saveResults(results)
    } else {
      console.log("No results to save")
    }

    return results
  } catch (error) {
    console.error("Error in scheduler:", error)
    throw error
  }
}

