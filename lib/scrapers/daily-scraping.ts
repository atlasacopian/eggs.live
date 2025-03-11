import { Pool } from "pg"
import { scrapeStore, savePrices } from "./egg-scraper"

// Define all store IDs - Costco completely removed
const storeIds = [
  "albertsons",
  "aldi",
  "food4less",
  "heb",
  "kroger",
  "meijer",
  "publix",
  "safeway",
  "sprouts",
  "target",
  "traderjoes",
  "walmart",
  "wegmans",
  "wholefoods",
  "erewhon",
  "foodlion",
  "gianteagle",
  "ralphs",
  "shoprite",
  "stopandshop",
  "vons",
  "winndixie",
  "weismarkets",
  "harristeeter",
]

// Function to generate a random price within a range
function randomPrice(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

export async function scrapeAllStores() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("Starting daily scraping...")

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split("T")[0]

    // Scrape prices for all stores
    const scrapedPrices = []
    const scrapingResults = []

    for (const storeId of storeIds) {
      try {
        // Use the scraper to get prices
        const result = await scrapeStore(storeId)

        if (result.regularPrice !== null) {
          scrapedPrices.push({
            storeId,
            price: result.regularPrice,
            date: formattedDate,
            eggType: "regular",
          })
        }

        if (result.organicPrice !== null) {
          scrapedPrices.push({
            storeId,
            price: result.organicPrice,
            date: formattedDate,
            eggType: "organic",
          })
        }

        // Save prices to database
        await savePrices(storeId, result.regularPrice, result.organicPrice)

        scrapingResults.push({
          storeId,
          status: "success",
          regularPrice: result.regularPrice,
          organicPrice: result.organicPrice,
        })
      } catch (error) {
        console.error(`Error scraping ${storeId}:`, error)
        scrapingResults.push({
          storeId,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Calculate and store average prices
    const eggTypes = ["regular", "organic"]

    for (const eggType of eggTypes) {
      // Calculate average price for this egg type
      const avgResult = await pool.query(
        `SELECT AVG(price) as avg_price, COUNT(*) as store_count 
         FROM egg_prices 
         WHERE date = $1 AND "eggType" = $2`,
        [formattedDate, eggType],
      )

      const avgPrice = Number.parseFloat(avgResult.rows[0].avg_price) || 0
      const storeCount = Number.parseInt(avgResult.rows[0].store_count) || 0

      if (storeCount > 0) {
        // Insert or update average price
        const id = `${formattedDate}-${eggType}`
        await pool.query(
          `INSERT INTO average_prices (id, date, price, "storeCount", "eggType") 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (date, "eggType") DO UPDATE 
           SET price = $3, "storeCount" = $4`,
          [id, formattedDate, avgPrice, storeCount, eggType],
        )
      }
    }

    await pool.end()

    return {
      success: true,
      message: "Daily scraping completed successfully",
      scrapedCount: scrapedPrices.length,
      date: formattedDate,
      results: scrapingResults,
    }
  } catch (error) {
    console.error("Scraping error:", error)

    // Make sure to close the pool even on error
    try {
      await pool.end()
    } catch (closeError) {
      console.error("Error closing pool:", closeError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

