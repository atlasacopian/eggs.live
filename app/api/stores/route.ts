import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const result = await pool.query(`
      SELECT id, name, website
      FROM stores
      ORDER BY name ASC
    `)

    await pool.end()

    return NextResponse.json({
      success: true,
      stores: result.rows,
    })
  } catch (error) {
    console.error("Error fetching stores:", error)

    // Make sure to close the pool even on error
    try {
      await pool.end()
    } catch (closeError) {
      console.error("Error closing pool:", closeError)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch store data",
      },
      { status: 500 },
    )
  }
}

