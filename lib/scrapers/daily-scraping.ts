import { scrapeStore, savePrices } from "./egg-scraper"
import { Pool } from "pg"

export async function scrapeAllStores() {
  console.log("Starting egg price scraping for all stores...")

  // Define all stores to scrape
  const stores = [
    "albertsons",
    "aldi",
    "food4less", // Replaced Trader Joe's with Food 4 Less
    "heb",
    "kroger",
    "meijer",
    "publix",
    "safeway",
    "sprouts",
    "target",
    "walmart",
    "wegmans",
    "wholefoods",
    "erewhon", // Added Erewhon
    "foodlion",
    "gianteagle",
    "ralphs",
    "shoprite",
    "stopandshop",
    "vons",
    "winndixie",
    "weismarkets",
    "harristeeter",
    "smartfinal", // Added Smart & Final
  ]

  const results = []
  let successCount = 0

  // Scrape each store
  for (const storeId of stores) {
    try {
      console.log(`Scraping ${storeId}...`)

      // Scrape the store
      const { regularPrice, organicPrice } = await scrapeStore(storeId)

      // Save the prices
      const success = await savePrices(storeId, regularPrice, organicPrice)

      if (success) {
        successCount++
        results.push({
          store: storeId,
          status: "success",
          regularPrice,
          organicPrice,
        })
      } else {
        results.push({
          store: storeId,
          status: "error",
          error: "Failed to save prices",
        })
      }
    } catch (error) {
      console.error(`Error scraping ${storeId}:`, error)
      results.push({
        store: storeId,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Calculate and store average prices
  await calculateAveragePrices()

  console.log(`Scraping completed. Successful: ${successCount}/${stores.length}`)

  return {
    success: true,
    scrapedCount: successCount,
    totalStores: stores.length,
    results,
  }
}

export async function runDailyScraping() {
  return await scrapeAllStores()
}

async function calculateAveragePrices() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split("T")[0]

    // Calculate average for regular eggs
    const regularResult = await pool.query(
      `SELECT AVG(price) as avg_price, COUNT(*) as store_count 
       FROM egg_prices 
       WHERE date = $1 AND "eggType" = 'regular' AND price IS NOT NULL`,
      [formattedDate],
    )

    const regularAvgPrice = Number.parseFloat(regularResult.rows[0].avg_price) || 0
    const regularStoreCount = Number.parseInt(regularResult.rows[0].store_count) || 0

    if (regularStoreCount > 0) {
      const regularId = `${formattedDate}-regular`
      await pool.query(
        `INSERT INTO average_prices (id, date, price, "storeCount", "eggType") 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (date, "eggType") DO UPDATE 
         SET price = $3, "storeCount" = $4`,
        [regularId, formattedDate, regularAvgPrice, regularStoreCount, "regular"],
      )
    }

    // Calculate average for organic eggs
    const organicResult = await pool.query(
      `SELECT AVG(price) as avg_price, COUNT(*) as store_count 
       FROM egg_prices 
       WHERE date = $1 AND "eggType" = 'organic' AND price IS NOT NULL`,
      [formattedDate],
    )

    const organicAvgPrice = Number.parseFloat(organicResult.rows[0].avg_price) || 0
    const organicStoreCount = Number.parseInt(organicResult.rows[0].store_count) || 0

    if (organicStoreCount > 0) {
      const organicId = `${formattedDate}-organic`
      await pool.query(
        `INSERT INTO average_prices (id, date, price, "storeCount", "eggType") 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (date, "eggType") DO UPDATE 
         SET price = $3, "storeCount" = $4`,
        [organicId, formattedDate, organicAvgPrice, organicStoreCount, "organic"],
      )
    }

    await pool.end()

    return {
      regularAvgPrice,
      regularStoreCount,
      organicAvgPrice,
      organicStoreCount,
    }
  } catch (error) {
    console.error("Error calculating average prices:", error)

    // Make sure to close the pool even on error
    try {
      await pool.end()
    } catch (closeError) {
      console.error("Error closing pool:", closeError)
    }

    return null
  }
}

