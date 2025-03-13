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

    // Simple extraction prompt
    const extractionPrompt = `
      Extract all egg prices from this page. For each egg product, provide:
      1. The price (just the number, e.g. 3.99)
      2. Whether it's organic or regular eggs
      3. The package size (dozen, half-dozen, etc.)
      
      Format as JSON with an array of products.
    `

    // Call Firecrawl API
    const response = await fetch("https://api.firecrawl.dev/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: storeUrl,
        prompt: extractionPrompt,
      }),
    })

    // Check response
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          error: `Firecrawl API error (${response.status})`,
          details: errorText,
        },
        { status: 500 },
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
    return NextResponse.json(
      {
        error: "Test scrape failed",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

