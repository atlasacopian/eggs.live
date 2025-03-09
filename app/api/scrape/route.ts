import { NextResponse } from "next/server"
import { scrapeEggPrices } from "@/lib/scrapers"

// This endpoint is protected with a secret key to prevent unauthorized access
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("key")

    // Verify API key
    if (apiKey !== process.env.SCRAPER_API_KEY_2) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the scraper
    const results = await scrapeEggPrices()

    return NextResponse.json({
      success: true,
      message: "Scraping completed successfully",
      results,
    })
  } catch (error) {
    console.error("Scraping error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to scrape prices",
      },
      { status: 500 },
    )
  }
}

// Add GET method to allow browser access
export async function GET(request: Request) {
  return POST(request)
}
