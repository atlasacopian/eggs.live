import { NextResponse } from "next/server"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("Authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Full LA scrape cron job initiated")
    const results = await scrapeAllStores(true) // true = scrape all stores

    // Count successful scrapes
    const successCount = results.filter((r) => r.success && r.count > 0).length

    return NextResponse.json({
      success: true,
      message: "Full LA scrape completed",
      date: new Date().toISOString(),
      scrapedCount: successCount,
      totalAttempted: results.length,
    })
  } catch (error) {
    console.error("Error in full LA scrape cron job:", error)
    return NextResponse.json(
      {
        error: "Failed to run full LA scraping job",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

