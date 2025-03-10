import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const formattedDate = today.toISOString().split("T")[0]

    // Fetch all prices for today with store information
    const result = await pool.query(
      `
      SELECT ep.*, s.name as store_name, s.website as store_website
      FROM egg_prices ep
      JOIN stores s ON ep.\"storeId\" = s.id
      WHERE ep.date = $1
      ORDER BY s.name ASC, ep.\"eggType\" ASC
    `,
      [formattedDate],
    )

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
        error: "Failed to fetch prices",
      },
      { status: 500 },
    )
  }
}

