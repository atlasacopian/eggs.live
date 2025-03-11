import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eggType = searchParams.get("eggType") || "regular"
  const storeId = searchParams.get("storeId")

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    let query = `
      SELECT ep.id, ep."storeId", ep.price, ep.date, ep."eggType"
      FROM egg_prices ep
      WHERE ep."eggType" = $1
    `

    const params = [eggType]

    if (storeId) {
      query += ` AND ep."storeId" = $2`
      params.push(storeId)
    }

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split("T")[0]

    query += ` AND ep.date = $${params.length + 1}`
    params.push(formattedDate)

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

