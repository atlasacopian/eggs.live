import { NextResponse } from "next/server"

// Tell Next.js this is a dynamic route
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Verify the cron secret to ensure this is a legitimate request
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, just return a success message
    // We'll implement the actual scraping later
    return NextResponse.json({
      success: true,
      message: "Cron job executed successfully",
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ error: "Failed to run cron job" }, { status: 500 })
  }
}

