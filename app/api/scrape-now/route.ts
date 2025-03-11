import { NextResponse } from "next/server"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"

export async function POST(request: Request) {
  try {
    console.log("Manual scraping triggered...")

    // Run the scraper for all stores
    const result = await scrapeAllStores()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to scrape prices",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Successfully scraped egg prices",
      scrapedCount: result.scrapedCount || 0,
      date: result.date || new Date().toISOString().split("T")[0],
    })
  } catch (error) {
    console.error("Manual scraping error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

