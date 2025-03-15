import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the API key
    const apiKey = process.env.FIRECRAWL_API_KEY

    // Basic info
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 5)}...` : "Not set",
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION || "unknown",
    }

    // If no API key, return early
    if (!apiKey) {
      return res.status(200).json({
        ...diagnosticInfo,
        success: false,
        error: "API key not configured",
        message: "Please set the FIRECRAWL_API_KEY environment variable",
      })
    }

    // Try multiple base URLs
    const baseUrls = [
      "https://api.firecrawl.com",
      "https://api.firecrawl.dev",
      "https://firecrawl.com/api",
      "https://firecrawl.dev/api",
    ]

    const connectionTests = []

    // Test each base URL
    for (const baseUrl of baseUrls) {
      try {
        console.log(`Testing connection to ${baseUrl}...`)

        // First try a simple GET request to /status
        const statusResponse = await fetch(`${baseUrl}/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })

        const statusResponseText = await statusResponse.text()

        // Then try a simple POST request to /scrape with minimal data
        const scrapeResponse = await fetch(`${baseUrl}/scrape`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            url: "https://example.com",
            timeout: 5000,
          }),
        })

        const scrapeResponseText = await scrapeResponse.text()

        connectionTests.push({
          baseUrl,
          statusEndpoint: {
            success: statusResponse.ok,
            status: statusResponse.status,
            response: statusResponseText.substring(0, 500), // First 500 chars
          },
          scrapeEndpoint: {
            success: scrapeResponse.ok,
            status: scrapeResponse.status,
            response: scrapeResponseText.substring(0, 500), // First 500 chars
          },
        })

        // If both endpoints worked, we found our API!
        if (statusResponse.ok && scrapeResponse.ok) {
          break
        }
      } catch (error) {
        connectionTests.push({
          baseUrl,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        })
      }
    }

    // Find a working base URL
    const workingBaseUrl = connectionTests.find(
      (test) => test.statusEndpoint?.success && test.scrapeEndpoint?.success,
    )?.baseUrl

    return res.status(200).json({
      ...diagnosticInfo,
      success: !!workingBaseUrl,
      workingBaseUrl,
      connectionTests,
      message: workingBaseUrl
        ? `Successfully connected to Firecrawl API at ${workingBaseUrl}`
        : "Failed to connect to any Firecrawl API endpoints",
    })
  } catch (error) {
    console.error("Firecrawl diagnostic error:", error)

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    })
  }
}

