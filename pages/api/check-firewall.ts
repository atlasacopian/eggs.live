import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "API key not configured",
      })
    }

    // Try both potential base URLs
    const baseUrls = ["https://api.firecrawl.com", "https://api.firecrawl.dev"]

    const results = []

    for (const baseUrl of baseUrls) {
      try {
        console.log(`Testing connection to ${baseUrl}...`)

        const response = await fetch(`${baseUrl}/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        })

        const responseText = await response.text()
        let responseData = null

        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          // Response wasn't JSON
        }

        results.push({
          baseUrl,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          responseText: responseText.substring(0, 1000), // First 1000 chars only
          responseData,
        })

        if (response.ok) {
          // We found a working URL, no need to try others
          break
        }
      } catch (error) {
        results.push({
          baseUrl,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Find the first successful result, if any
    const successfulResult = results.find((r) => r.success)

    return res.status(200).json({
      success: !!successfulResult,
      apiKeyConfigured: true,
      apiKeyPrefix: apiKey.substring(0, 5) + "...",
      results,
      workingBaseUrl: successfulResult?.baseUrl,
      message: successfulResult ? "Successfully connected to Firecrawl API" : "Failed to connect to Firecrawl API",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking Firecrawl:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to check Firecrawl configuration",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : undefined,
    })
  }
}

