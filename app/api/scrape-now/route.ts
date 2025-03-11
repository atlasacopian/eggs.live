import { NextResponse } from "next/server"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"

export async function POST(request: Request) {
  try {
    console.log("Manual scraping triggered...")

    // Run the scraper for all stores
    const result = await scrapeAllStores()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Manual scraping error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

