import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get the admin key from the URL
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

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

    const apiKey = process.env.FIRECRAWL_API_KEY

    // Try to verify the API key by making a simple request
    const response = await fetch("https://firecrawl.dev/api/auth/verify", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          error: "API key verification failed",
          status: response.status,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const result = await response.json()
    return NextResponse.json({
      success: true,
      message: "API key verified successfully",
      details: result,
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      {
        error: "API key verification failed",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

