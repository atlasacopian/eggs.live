import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get the admin key from the URL
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    // Check if the key matches
    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check which environment variables are set
    return NextResponse.json({
      success: true,
      environment: {
        adminKeySet: !!process.env.ADMIN_KEY,
        firecrawlKeySet: !!process.env.FIRECRAWL_API_KEY,
        databaseUrlSet: !!process.env.DATABASE_URL,
      },
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Environment check failed" }, { status: 500 })
  }
}

