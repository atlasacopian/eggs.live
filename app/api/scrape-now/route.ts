import { NextResponse } from "next/server"
import { scrapeAllStores, scrapeEchoParkStores } from "@/lib/scrapers/daily-scraping"

export async function GET(request: Request) {
  try {
    // This endpoint is for manual testing, so we'll add some basic auth
    // In production, you might want to restrict this to admin users
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the scrapers
    console.log("Running manual egg price scraping...")

    const nationwideResults = await scrapeAllStores()
    const echoParkResults = await scrapeEchoParkStores()

    return NextResponse.json({
      success: true,
      message: "Manual egg price scraping completed successfully",
      nationwideResults,
      echoParkResults,
    })
  } catch (error) {
    console.error("Error in manual scrape:", error)
    return NextResponse.json({ error: "Failed to run scraping job" }, { status: 500 })
  }
}

