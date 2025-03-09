import { NextResponse } from "next/server"
import { scheduleDailyScraping } from "@/lib/scrapers/scheduler"

// This endpoint is protected with a secret key to prevent unauthorized access
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("key")

    // Verify API key
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the daily scraping scheduler
    await scheduleDailyScraping()

    return NextResponse.json({
      success: true,
      message: "Daily egg price scraping initiated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Scraping error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initiate scraping job",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Add GET method to allow browser access
export async function GET(request: Request) {
  return POST(request)
}
