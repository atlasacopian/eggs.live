import { NextResponse } from "next/server"
import { Pool } from "pg"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("Starting database seeding with direct SQL...")

    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateStr = today.toISOString()

    // List of stores to seed
    const stores = [
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
      "smartfinal",
    ]

    // First, ensure all stores exist in the database
    for (const storeName of stores) {
      try {
        // Check if store exists
        const storeResult = await pool.query(`SELECT id FROM store WHERE name = $1`, [storeName])

        let storeId

        if (storeResult.rows.length === 0) {
          // Create store if it doesn't exist
          const newStore = await pool.query(`INSERT INTO store (name, website) VALUES ($1, $2) RETURNING id`, [
            storeName,
            `https://www.${storeName}.com`,
          ])
          storeId = newStore.rows[0].id
          console.log(`Created store: ${storeName} with ID ${storeId}`)
        } else {
          storeId = storeResult.rows[0].id
          console.log(`Found existing store: ${storeName} with ID ${storeId}`)
        }

        // Create a default store location for each store
        const locationResult = await pool.query(`SELECT id FROM store_locations WHERE store_id = $1 AND zipCode = $2`, [
          storeId,
          "00000",
        ])

        let locationId

        if (locationResult.rows.length === 0) {
          // Create default location
          const newLocation = await pool.query(
            `INSERT INTO store_locations (store_id, address, zipCode) 
             VALUES ($1, $2, $3) RETURNING id`,
            [storeId, "Default Location", "00000"],
          )
          locationId = newLocation.rows[0].id
          console.log(`Created location for ${storeName} with ID ${locationId}`)
        } else {
          locationId = locationResult.rows[0].id
          console.log(`Found existing location for ${storeName} with ID ${locationId}`)
        }

        // Insert regular eggs price
        await pool.query(
          `INSERT INTO egg_prices (store_location_id, price, date, "eggType") 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (store_location_id, date, "eggType") DO UPDATE 
           SET price = $2`,
          [locationId, (Math.random() * 2 + 3).toFixed(2), dateStr, "regular"],
        )
        console.log(`Inserted regular egg price for ${storeName}`)

        // Insert organic eggs price
        await pool.query(
          `INSERT INTO egg_prices (store_location_id, price, date, "eggType") 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (store_location_id, date, "eggType") DO UPDATE 
           SET price = $2`,
          [locationId, (Math.random() * 3 + 5).toFixed(2), dateStr, "organic"],
        )
        console.log(`Inserted organic egg price for ${storeName}`)
      } catch (error) {
        console.error(`Error processing store ${storeName}:`, error)
      }
    }

    // Calculate and store average prices
    try {
      const regularAvg = await pool.query(
        `SELECT AVG(price) as avg FROM egg_prices WHERE date = $1 AND "eggType" = 'regular'`,
        [dateStr],
      )
      console.log("Regular eggs average:", regularAvg.rows[0].avg)
    } catch (error) {
      console.error("Error calculating average for regular:", error)
    }

    try {
      const organicAvg = await pool.query(
        `SELECT AVG(price) as avg FROM egg_prices WHERE date = $1 AND "eggType" = 'organic'`,
        [dateStr],
      )
      console.log("Organic eggs average:", organicAvg.rows[0].avg)
    } catch (error) {
      console.error("Error calculating average for organic:", error)
    }

    await pool.end()

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed database",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

