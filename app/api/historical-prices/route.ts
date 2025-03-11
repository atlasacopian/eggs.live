import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eggType = searchParams.get("eggType") || "regular"
  const days = Number.parseInt(searchParams.get("days") || "30", 10)

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    // Get prices for the last X days
    const result = await pool.query(
      `
      SELECT date, price, "storeCount"
      FROM average_prices
      WHERE "eggType" = $1
      AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `,
      [eggType],
    )

    await pool.end()

    return NextResponse.json({
      success: true,
      prices: result.rows,
    })
  } catch (error) {
    console.error("Error fetching historical prices:", error)

    // Make sure to close the pool even on error
    try {
      await pool.end()
    } catch (closeError) {
      console.error("Error closing pool:", closeError)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch historical price data",
      },
      { status: 500 },
    )
  }
}

