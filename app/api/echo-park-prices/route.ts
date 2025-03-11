import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eggType = searchParams.get("eggType")

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    // Create the echo_park_egg_prices view if it doesn't exist
    await pool.query(`
      CREATE OR REPLACE VIEW echo_park_egg_prices AS
      SELECT 
        lep.id,
        sl."storeId",
        s.name as store_name,
        s.website as store_website,
        sl.location,
        sl.address,
        lep.price,
        lep.date,
        lep."eggType"
      FROM la_egg_prices lep
      JOIN store_locations sl ON lep."storeLocationId" = sl.id
      JOIN stores s ON sl."storeId" = s.id
      WHERE 
        sl.location IN ('Echo Park', 'Silver Lake') OR
        sl.address LIKE '%90026%' OR
        sl.address LIKE '%Echo Park%' OR
        sl.address LIKE '%Silver Lake%'
    `)

    // Query the view
    let query = `
      SELECT * FROM echo_park_egg_prices
      WHERE price IS NOT NULL
    `

    const params = []
    if (eggType) {
      query += ` AND "eggType" = $1`
      params.push(eggType)
    }

    query += ` ORDER BY store_name ASC, location ASC`

    const result = await pool.query(query, params)

    // Calculate average prices for Echo Park area
    const avgQuery = `
      SELECT 
        "eggType", 
        AVG(price) as avg_price, 
        COUNT(*) as store_count
      FROM echo_park_egg_prices
      WHERE price IS NOT NULL
      ${eggType ? `AND "eggType" = $1` : ""}
      GROUP BY "eggType"
    `

    const avgResult = await pool.query(avgQuery, eggType ? [eggType] : [])

    // Format the averages
    const averages = avgResult.rows.map((row) => ({
      eggType: row.eggType,
      avgPrice: Number.parseFloat(row.avg_price) || 0,
      storeCount: Number.parseInt(row.store_count) || 0,
    }))

    await pool.end()

    return NextResponse.json({
      success: true,
      prices: result.rows,
      averages: averages,
    })
  } catch (error) {
    console.error("Error fetching Echo Park prices:", error)

    // Make sure to close the pool even on error
    try {
      await pool.end()
    } catch (closeError) {
      console.error("Error closing pool:", closeError)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Echo Park price data",
      },
      { status: 500 },
    )
  }
}

