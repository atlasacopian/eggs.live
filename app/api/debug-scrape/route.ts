import { NextResponse } from "next/server"
import { scrapeWithFirecrawl } from "@/lib/scrapers/firecrawl-scraper"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    // Allow overriding the store for testing
    const store = searchParams.get("store") || "Albertsons"
    const url = searchParams.get("url") || "https://www.albertsons.com/shop/search-results.html?q=eggs"

    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Debug scraping ${store} at ${url}`)

    const results = await scrapeWithFirecrawl(url, store)

    return NextResponse.json({
      success: true,
      store,
      url,
      resultsCount: results.length,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug scrape error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

