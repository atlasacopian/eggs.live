import { NextResponse } from "next/server"
import { Pool } from "pg"

// Define LA store locations to scrape
const laStores = [
  // Ralphs locations
  { storeId: "ralphs", location: "Echo Park", address: "1416 Glendale Blvd, Los Angeles, CA 90026" },
  { storeId: "ralphs", location: "Silver Lake", address: "2600 W Sunset Blvd, Los Angeles, CA 90026" },
  { storeId: "ralphs", location: "Downtown", address: "645 W 9th St, Los Angeles, CA 90015" },

  // Vons locations
  { storeId: "vons", location: "Silver Lake", address: "1342 N Alvarado St, Los Angeles, CA 90026" },
  { storeId: "vons", location: "Koreatown", address: "3461 W 3rd St, Los Angeles, CA 90020" },
  { storeId: "vons", location: "Downtown", address: "1212 S Flower St, Los Angeles, CA 90015" },

  // Albertsons locations
  { storeId: "albertsons", location: "Los Feliz", address: "2035 Hillhurst Ave, Los Angeles, CA 90027" },
  { storeId: "albertsons", location: "Glendale", address: "1000 S Central Ave, Glendale, CA 91204" },
  { storeId: "albertsons", location: "Burbank", address: "3830 W Verdugo Ave, Burbank, CA 91505" },

  // Food 4 Less locations (replacing Trader Joe's)
  { storeId: "food4less", location: "Central LA", address: "1700 W 6th St, Los Angeles, CA 90017" },
  { storeId: "food4less", location: "Hollywood", address: "5420 Sunset Blvd, Los Angeles, CA 90027" },
  { storeId: "food4less", location: "Glassell Park", address: "2750 N San Fernando Rd, Los Angeles, CA 90065" },

  // Smart & Final locations (new addition)
  { storeId: "smartfinal", location: "Silver Lake", address: "1559 Echo Park Ave, Los Angeles, CA 90026" },
  { storeId: "smartfinal", location: "Hollywood", address: "5555 Hollywood Blvd, Los Angeles, CA 90028" },
  { storeId: "smartfinal", location: "Downtown", address: "845 S Figueroa St, Los Angeles, CA 90017" },

  // Erewhon locations (new addition)
  { storeId: "erewhon", location: "Silver Lake", address: "4121 Santa Monica Blvd, Los Angeles, CA 90029" },
  { storeId: "erewhon", location: "Venice", address: "585 Venice Blvd, Venice, CA 90291" },
  { storeId: "erewhon", location: "Beverly", address: "339 N Beverly Dr, Beverly Hills, CA 90210" },
]

// Mock function to simulate scraping a specific store location
async function scrapeStoreLocation(
  storeId: string,
  location: string,
): Promise<{
  regularPrice: number | null
  organicPrice: number | null
}> {
  console.log(`Scraping ${storeId} at ${location}...`)

  // Simulate different price ranges for different stores
  let regularMin = 2.99
  let regularMax = 4.99
  let organicMin = 5.99
  let organicMax = 8.99

  // Adjust price ranges based on store
  switch (storeId) {
    case "erewhon":
      regularMin = 5.99
      regularMax = 7.99
      organicMin = 8.99
      organicMax = 12.99
      break
    case "albertsons":
    case "vons":
      regularMin = 3.49
      regularMax = 4.79
      organicMin = 6.49
      organicMax = 7.99
      break
    case "food4less":
      regularMin = 2.49
      regularMax = 3.99
      organicMin = 5.49
      organicMax = 6.99
      break
    case "smartfinal":
      regularMin = 2.79
      regularMax = 4.29
      organicMin = 5.79
      organicMax = 7.49
      break
  }

  // Generate random prices within the adjusted ranges
  const regularPrice = Math.round((Math.random() * (regularMax - regularMin) + regularMin) * 100) / 100
  const organicPrice = Math.round((Math.random() * (organicMax - organicMin) + organicMin) * 100) / 100

  // Simulate some stores not having organic eggs
  const hasOrganic = !["food4less"].includes(storeId) || Math.random() > 0.3

  return {
    regularPrice,
    organicPrice: hasOrganic ? organicPrice : null,
  }
}

export async function POST(request: Request) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("Starting LA store scraping...")

    // Create store_locations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_locations (
        id TEXT PRIMARY KEY,
        "storeId" TEXT NOT NULL,
        location TEXT NOT NULL,
        address TEXT NOT NULL,
        FOREIGN KEY ("storeId") REFERENCES stores(id)
      )
    `)

    // Create la_egg_prices table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS la_egg_prices (
        id TEXT PRIMARY KEY,
        "storeLocationId" TEXT NOT NULL,
        price FLOAT,
        date DATE NOT NULL,
        "eggType" TEXT NOT NULL,
        UNIQUE("storeLocationId", date, "eggType"),
        FOREIGN KEY ("storeLocationId") REFERENCES store_locations(id)
      )
    `)

    // Make sure all store IDs exist in the stores table
    const storeIds = [...new Set(laStores.map((store) => store.storeId))]

    // Add Smart & Final to stores table if it doesn't exist
    await pool.query(`
      INSERT INTO stores (id, name, website)
      VALUES ('smartfinal', 'Smart & Final', 'https://www.smartandfinal.com')
      ON CONFLICT (id) DO UPDATE
      SET name = 'Smart & Final', website = 'https://www.smartandfinal.com'
    `)

    // Insert or update store locations
    for (const store of laStores) {
      const locationId = `${store.storeId}-${store.location.toLowerCase().replace(/\s+/g, "-")}`

      await pool.query(
        `
        INSERT INTO store_locations (id, "storeId", location, address)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET "storeId" = $2, location = $3, address = $4
      `,
        [locationId, store.storeId, store.location, store.address],
      )
    }

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split("T")[0]

    // Scrape prices for all LA store locations
    const scrapingResults = []

    for (const store of laStores) {
      try {
        const locationId = `${store.storeId}-${store.location.toLowerCase().replace(/\s+/g, "-")}`

        // Scrape prices for this location
        const result = await scrapeStoreLocation(store.storeId, store.location)

        // Save regular egg price
        if (result.regularPrice !== null) {
          const regularId = `${locationId}-${formattedDate}-regular`
          await pool.query(
            `
            INSERT INTO la_egg_prices (id, "storeLocationId", price, date, "eggType")
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT ("storeLocationId", date, "eggType") DO UPDATE
            SET price = $3
          `,
            [regularId, locationId, result.regularPrice, formattedDate, "regular"],
          )
        }

        // Save organic egg price
        if (result.organicPrice !== null) {
          const organicId = `${locationId}-${formattedDate}-organic`
          await pool.query(
            `
            INSERT INTO la_egg_prices (id, "storeLocationId", price, date, "eggType")
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT ("storeLocationId", date, "eggType") DO UPDATE
            SET price = $3
          `,
            [organicId, locationId, result.organicPrice, formattedDate, "organic"],
          )
        }

        scrapingResults.push({
          store: store.storeId,
          location: store.location,
          status: "success",
          regularPrice: result.regularPrice,
          organicPrice: result.organicPrice,
        })
      } catch (error) {
        console.error(`Error scraping ${store.storeId} at ${store.location}:`, error)
        scrapingResults.push({
          store: store.storeId,
          location: store.location,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Calculate average prices for LA
    const avgRegularResult = await pool.query(
      `
      SELECT AVG(price) as avg_price, COUNT(*) as store_count
      FROM la_egg_prices
      WHERE date = $1 AND "eggType" = 'regular' AND price IS NOT NULL
    `,
      [formattedDate],
    )

    const avgOrganicResult = await pool.query(
      `
      SELECT AVG(price) as avg_price, COUNT(*) as store_count
      FROM la_egg_prices
      WHERE date = $1 AND "eggType" = 'organic' AND price IS NOT NULL
    `,
      [formattedDate],
    )

    const avgRegularPrice = Number.parseFloat(avgRegularResult.rows[0].avg_price) || 0
    const regularStoreCount = Number.parseInt(avgRegularResult.rows[0].store_count) || 0

    const avgOrganicPrice = Number.parseFloat(avgOrganicResult.rows[0].avg_price) || 0
    const organicStoreCount = Number.parseInt(avgOrganicResult.rows[0].store_count) || 0

    await pool.end()

    return NextResponse.json({
      success: true,
      message: "LA store scraping completed successfully",
      date: formattedDate,
      storeCount: laStores.length,
      regularAvgPrice: avgRegularPrice,
      regularStoreCount,
      organicAvgPrice: avgOrganicPrice,
      organicStoreCount,
      results: scrapingResults,
    })
  } catch (error) {
    console.error("LA scraping error:", error)

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

