import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET() {
  // Create a new connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("Starting database seeding with direct SQL...")

    // Create stores table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT NOT NULL
      )
    `)

    // Create egg_prices table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS egg_prices (
        id TEXT PRIMARY KEY,
        "storeId" TEXT NOT NULL,
        price FLOAT NOT NULL,
        date DATE NOT NULL,
        "eggType" TEXT NOT NULL,
        UNIQUE("storeId", date, "eggType"),
        FOREIGN KEY ("storeId") REFERENCES stores(id)
      )
    `)

    // Create average_prices table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS average_prices (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        price FLOAT NOT NULL,
        "storeCount" INTEGER NOT NULL,
        "eggType" TEXT NOT NULL,
        UNIQUE(date, "eggType")
      )
    `)

    // Define all stores
    const stores = [
      // Existing stores
      { id: "walmart", name: "Walmart", website: "https://www.walmart.com" },
      { id: "kroger", name: "Kroger", website: "https://www.kroger.com" },
      { id: "target", name: "Target", website: "https://www.target.com" },
      { id: "food4less", name: "Food 4 Less", website: "https://www.food4less.com" },
      { id: "albertsons", name: "Albertsons", website: "https://www.albertsons.com" },
      { id: "aldi", name: "Aldi", website: "https://www.aldi.us" },
      { id: "costco", name: "Costco", website: "https://www.costco.com" },
      { id: "heb", name: "HEB", website: "https://www.heb.com" },
      { id: "meijer", name: "Meijer", website: "https://www.meijer.com" },
      { id: "publix", name: "Publix", website: "https://www.publix.com" },
      { id: "safeway", name: "Safeway", website: "https://www.safeway.com" },
      { id: "sprouts", name: "Sprouts", website: "https://www.sprouts.com" },
      { id: "traderjoes", name: "Trader Joe's", website: "https://www.traderjoes.com" },
      { id: "wegmans", name: "Wegmans", website: "https://www.wegmans.com" },
      { id: "wholefoods", name: "Whole Foods", website: "https://www.wholefoodsmarket.com" },

      // Missing stores
      { id: "erewhon", name: "Erewhon", website: "https://www.erewhonmarket.com" },
      { id: "foodlion", name: "Food Lion", website: "https://www.foodlion.com" },
      { id: "gianteagle", name: "Giant Eagle", website: "https://www.gianteagle.com" },
      { id: "ralphs", name: "Ralphs", website: "https://www.ralphs.com" },
      { id: "shoprite", name: "ShopRite", website: "https://www.shoprite.com" },
      { id: "stopandshop", name: "Stop & Shop", website: "https://www.stopandshop.com" },
      { id: "vons", name: "Vons", website: "https://www.vons.com" },
      { id: "winndixie", name: "Winn-Dixie", website: "https://www.winndixie.com" },
    ]

    // Insert stores
    const storeResults = []
    for (const store of stores) {
      try {
        await pool.query(
          `INSERT INTO stores (id, name, website) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) DO UPDATE 
           SET name = $2, website = $3`,
          [store.id, store.name, store.website],
        )
        storeResults.push({ store: store.id, status: "success" })
      } catch (error) {
        console.error(`Error inserting store ${store.id}:`, error)
        storeResults.push({
          store: store.id,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Add sample egg prices for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split("T")[0]

    // Sample prices for all stores
    const samplePrices = []

    // Generate sample prices for all stores
    for (const store of stores) {
      // Regular eggs (price between $2.79 and $4.49)
      const regularPrice = (Math.random() * (4.49 - 2.79) + 2.79).toFixed(2)
      samplePrices.push({
        storeId: store.id,
        price: Number.parseFloat(regularPrice),
        date: formattedDate,
        eggType: "regular",
      })

      // Organic eggs (price between $4.99 and $7.49)
      const organicPrice = (Math.random() * (7.49 - 4.99) + 4.99).toFixed(2)
      samplePrices.push({
        storeId: store.id,
        price: Number.parseFloat(organicPrice),
        date: formattedDate,
        eggType: "organic",
      })
    }

    // Insert egg prices
    const priceResults = []
    for (const price of samplePrices) {
      try {
        const id = `${price.storeId}-${price.date}-${price.eggType}`
        await pool.query(
          `INSERT INTO egg_prices (id, "storeId", price, date, "eggType") 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT ("storeId", date, "eggType") DO UPDATE 
           SET price = $3`,
          [id, price.storeId, price.price, price.date, price.eggType],
        )
        priceResults.push({ price: `${price.storeId}-${price.eggType}`, status: "success" })
      } catch (error) {
        console.error(`Error inserting price for ${price.storeId} (${price.eggType}):`, error)
        priceResults.push({
          price: `${price.storeId}-${price.eggType}`,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Calculate and store average prices
    const eggTypes = ["regular", "organic"]
    const avgResults = []

    for (const eggType of eggTypes) {
      try {
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

          avgResults.push({ type: eggType, status: "success", avg: avgPrice, storeCount })
        } else {
          avgResults.push({ type: eggType, status: "skipped", reason: "No prices found" })
        }
      } catch (error) {
        console.error(`Error calculating average for ${eggType}:`, error)
        avgResults.push({
          type: eggType,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Close the pool
    await pool.end()

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with direct SQL",
      results: {
        stores: storeResults,
        prices: priceResults,
        averages: avgResults,
      },
    })
  } catch (error) {
    console.error("Seed error:", error)

    // Make sure to close the pool even on error
    try {
      await pool.end()
    } catch (closeError) {
      console.error("Error closing pool:", closeError)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

