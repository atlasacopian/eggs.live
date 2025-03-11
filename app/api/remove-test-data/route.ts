import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function POST(request: Request) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("Removing test data from database...")

    // First, get all test store IDs
    const testStoresResult = await pool.query(`
    SELECT id FROM stores 
    WHERE name LIKE '%TEST%' 
    OR name LIKE '%test%'
  `)

    const testStoreIds = testStoresResult.rows.map((row) => row.id)

    // Delete egg prices for test stores
    const deleteEggPricesResult = await pool.query(
      `
    DELETE FROM egg_prices
    WHERE "storeId" = ANY($1)
  `,
      [testStoreIds],
    )

    console.log(`Deleted ${deleteEggPricesResult.rowCount} egg price records for test stores`)

    // Delete test store entries
    const deleteStoresResult = await pool.query(`
    DELETE FROM stores
    WHERE name LIKE '%TEST%'
    OR name LIKE '%test%'
  `)

    console.log(`Deleted ${deleteStoresResult.rowCount} test store records`)

    // Recalculate average prices
    const recalculateAverages = await pool.query(`
    WITH avg_data AS (
      SELECT 
        date, 
        "eggType", 
        AVG(price) as avg_price,
        COUNT(*) as store_count
      FROM egg_prices
      GROUP BY date, "eggType"
    )
    UPDATE average_prices ap
    SET 
      price = ad.avg_price,
      "storeCount" = ad.store_count
    FROM avg_data ad
    WHERE ap.date = ad.date AND ap."eggType" = ad."eggType"
  `)

    console.log(`Recalculated ${recalculateAverages.rowCount} average price records`)

    await pool.end()

    return NextResponse.json({
      success: true,
      message: "Test data successfully removed from database",
      deletedPrices: deleteEggPricesResult.rowCount,
      deletedStores: deleteStoresResult.rowCount,
      updatedAverages: recalculateAverages.rowCount,
    })
  } catch (error) {
    console.error("Error removing test data:", error)

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

