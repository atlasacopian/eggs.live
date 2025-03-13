import { NextResponse } from "next/server"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // This endpoint is for manual testing, so we'll add some basic auth
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Invalid or missing admin key",
        },
        { status: 401 },
      )
    }

    console.log("Manual LA scrape initiated")

    // First, check if we can access the database
    try {
      const storeCount = await prisma.store.count()
      console.log(`Database connection successful. Found ${storeCount} stores.`)
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection error",
          message: "Could not connect to database. Please check your database configuration.",
          details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
        },
        { status: 500 },
      )
    }

    // Run the scraper
    const results = await scrapeAllStores()

    // Count successful scrapes
    const successCount = results.filter((r) => r.success && r.count > 0).length
    const totalAttempted = results.length

    return NextResponse.json({
      success: true,
      message: `Manual LA scrape completed. Successfully scraped ${successCount} out of ${totalAttempted} stores.`,
      date: new Date().toISOString(),
      scrapedCount: successCount,
      totalAttempted,
      results: results.map((r) => ({
        store: r.store,
        zipCode: r.zipCode,
        success: r.success,
        count: r.count,
        ...(r.error && { error: r.error }),
      })),
    })
  } catch (error) {
    console.error("Error in manual LA scrape:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run LA scraping job",
        message: error.message || "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

