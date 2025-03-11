import { NextResponse } from "next/server"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"

export async function GET(request: Request) {
  // Check for authorization header
  const authHeader = request.headers.get("authorization")

  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Run the scraper for all stores
    const result = await scrapeAllStores()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Cron job error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

