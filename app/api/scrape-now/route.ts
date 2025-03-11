import { NextResponse } from "next/server"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"

export async function POST() {
  try {
    const result = await scrapeAllStores()

    return NextResponse.json({
      success: true,
      message: "Manual scraping completed successfully",
      date: new Date().toISOString().split("T")[0],
      ...result,
    })
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

