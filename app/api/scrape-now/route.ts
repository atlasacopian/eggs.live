import { NextResponse } from "next/server"

// Tell Next.js this is a dynamic route
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // This endpoint is for manual testing, so we'll add some basic auth
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, just return a success message
    // We'll implement the actual scraping later
    return NextResponse.json({
      success: true,
      message: "Manual scrape initiated",
    })
  } catch (error) {
    console.error("Error in manual scrape:", error)
    return NextResponse.json({ error: "Failed to run scraping job" }, { status: 500 })
  }
}

