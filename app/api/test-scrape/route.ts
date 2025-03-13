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

    // Test the Firecrawl API with a simple request
    const apiKey = process.env.FIRECRAWL_API_KEY
    const storeUrl = "https://www.albertsons.com/shop/search-results.html?q=eggs"

    // Call Firecrawl API - using the correct endpoint structure
    const response = await fetch("https://api.firecrawl.dev/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: storeUrl,
        selector: ".product-item-v2",
        fields: {
          name: ".product-title",
          price: ".product-price-amount",
          type: {
            selector: ".product-title",
            transform: 'text => text.toLowerCase().includes("organic") ? "organic" : "regular"',
          },
          size: {
            selector: ".product-title",
            transform: 'text => text.match(/(d+)s*(?:dozen|doz|ct)/i)?.[1] || "12"',
          },
        },
      }),
    })

    // Log the response status and headers for debugging
    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          error: `Firecrawl API error (${response.status})`,
          details: errorText,
          requestInfo: {
            url: "https://api.firecrawl.dev/extract",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer [HIDDEN]",
            },
          },
        },
        { status: response.status },
      )
    }

    // Return the raw result
    const result = await response.json()
    return NextResponse.json({
      success: true,
      message: "Test scrape completed",
      result: result,
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

