import { NextResponse } from "next/server"
import { scrapeAllStores, scrapeEchoParkStores } from "@/lib/scrapers/daily-scraping"

export async function GET(request: Request) {
  try {
    // Verify the cron secret to ensure this is a legitimate request
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the scrapers
    console.log("Running daily egg price scraping...")

    const nationwideResults = await scrapeAllStores()
    const echoParkResults = await scrapeEchoParkStores()

    return NextResponse.json({
      success: true,
      message: "Egg price scraping completed successfully",
      nationwideResults,
      echoParkResults,
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ error: "Failed to run scraping job" }, { status: 500 })
  }
}

