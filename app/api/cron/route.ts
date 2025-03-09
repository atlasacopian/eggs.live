import { NextResponse } from "next/server";
import { scheduleDailyScraping } from "@/lib/scrapers/scheduler";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get("key");

    // Verify API key
    if (apiKey !== process.env.SCRAPER_API_KEY_2) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run the daily scraping
    const result = await scheduleDailyScraping();

    return NextResponse.json({
      success: true,
      message: "Cron job completed successfully",
      result,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run cron job",
      },
      { status: 500 }
    );
  }
}

// Add POST method to allow webhook access
export async function POST(request: Request) {
  return GET(request);
}
