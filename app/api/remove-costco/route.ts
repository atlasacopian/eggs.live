import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log("Removing Costco from database...")

    // First, delete any egg prices associated with Costco
    const deleteEggPricesResult = await pool.query(`
      DELETE FROM egg_prices
      WHERE "storeId" = 'costco'
    `)

    console.log(`Deleted ${deleteEggPricesResult.rowCount} egg price records for Costco`)

    // Then, delete the Costco store entry
    const deleteStoreResult = await pool.query(`
      DELETE FROM stores
      WHERE id = 'costco'
    `)

    console.log(`Deleted ${deleteStoreResult.rowCount} store records for Costco`)

    // Recalculate average prices after removing Costco
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
      message: "Costco successfully removed from database",
      deletedPrices: deleteEggPricesResult.rowCount,
      deletedStore: deleteStoreResult.rowCount,
      updatedAverages: recalculateAverages.rowCount,
    })
  } catch (error) {
    console.error("Error removing Costco:", error)

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

