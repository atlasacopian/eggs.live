import { NextResponse } from "next/server"
import { scrapeWithFirecrawl } from "@/lib/scrapers/firecrawl-scraper"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get the admin key from the URL
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const url = searchParams.get("url") || "https://www.albertsons.com/shop/search-results.html?q=eggs"
    const store = searchParams.get("store") || "Albertsons"

    // Check if the key matches
    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Firecrawl API key exists
    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        {
          error: "Firecrawl API key not set in environment variables",
        },
        { status: 500 },
      )
    }

    console.log(`Testing Firecrawl scraper with URL: ${url} for store: ${store}`)

    // Use our updated scraper
    const results = await scrapeWithFirecrawl(url, store)

    return NextResponse.json({
      success: true,
      message: "Test scrape completed",
      url: url,
      store: store,
      results: results,
      count: results.length,
    })
  } catch (error) {
    console.error("Full error:", error)
    return NextResponse.json(
      {
        error: "Test scrape failed",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

