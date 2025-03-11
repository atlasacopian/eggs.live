import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eggType = searchParams.get("eggType")

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    let query = `
    SELECT ep.id, ep."storeId", ep.price, ep.date, ep."eggType", s.name as store_name, s.website as store_website
    FROM egg_prices ep
    JOIN stores s ON ep."storeId" = s.id
    WHERE s.id != 'costco' -- Exclude Costco
    AND s.name NOT LIKE '%TEST%' -- Exclude test entries
    AND s.name NOT LIKE '%test%'
  `

    const params = []
    if (eggType) {
      query += ` AND ep."eggType" = $1`
      params.push(eggType)
    }

    query += ` ORDER BY s.name ASC`

    const result = await pool.query(query, params)

    await pool.end()

    return NextResponse.json({
      success: true,
      prices: result.rows,
    })
  } catch (error) {
    console.error("Error fetching prices:", error)

    // Make sure to close the pool even on error
    try {
      await pool.end()
    } catch (closeError) {
      console.error("Error closing pool:", closeError)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch price data",
      },
      { status: 500 },
    )
  }
}

