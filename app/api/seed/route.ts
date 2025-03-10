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

    // Define stores
    const stores = [
      { id: "walmart", name: "Walmart", website: "https://www.walmart.com" },
      { id: "kroger", name: "Kroger", website: "https://www.kroger.com" },
      { id: "target", name: "Target", website: "https://www.target.com" },
      { id: "food4less", name: "Food 4 Less", website: "https://www.food4less.com" },
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

    // Add sample egg prices
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split("T")[0]

    const samplePrices = [
      { storeId: "walmart", price: 3.49, date: formattedDate, eggType: "regular" },
      { storeId: "walmart", price: 5.99, date: formattedDate, eggType: "organic" },
      { storeId: "kroger", price: 3.79, date: formattedDate, eggType: "regular" },
      { storeId: "kroger", price: 6.29, date: formattedDate, eggType: "organic" },
      { storeId: "target", price: 3.99, date: formattedDate, eggType: "regular" },
      { storeId: "target", price: 6.49, date: formattedDate, eggType: "organic" },
      { storeId: "food4less", price: 3.29, date: formattedDate, eggType: "regular" },
      { storeId: "food4less", price: 5.79, date: formattedDate, eggType: "organic" },
    ]

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

