import { NextResponse } from "next/server"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"

// Tell Next.js this is a dynamic route
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    // This endpoint is for manual testing, so we'll add some basic auth
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Manual scrape initiated")
    const results = await scrapeAllStores()

    // Count successful scrapes
    const successCount = results.filter((r) => r.success && r.count > 0).length

    return NextResponse.json({
      success: true,
      message: "Manual scrape completed",
      date: new Date().toISOString(),
      scrapedCount: successCount,
      results: results,
    })
  } catch (error) {
    console.error("Error in manual scrape:", error)
    return NextResponse.json(
      {
        error: "Failed to run scraping job",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

// Also support GET for easier testing
export async function GET(request: Request) {
  return POST(request)
}

