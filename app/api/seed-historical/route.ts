import { NextResponse } from "next/server"
import { seedHistoricalData } from "@/lib/scrapers"

// This endpoint is protected with a secret key to prevent unauthorized access
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("key")

    // Verify API key
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Seed historical data
    await seedHistoricalData()

    return NextResponse.json({
      success: true,
      message: "Historical data seeding completed successfully",
    })
  } catch (error) {
    console.error("Seeding error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to seed historical data",
      },
      { status: 500 },
    )
  }
}

