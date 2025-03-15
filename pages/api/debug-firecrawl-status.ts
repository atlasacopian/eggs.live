import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY

    // Basic info
    const info = {
      timestamp: new Date().toISOString(),
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 5)}...` : "Not set",
      environment: process.env.NODE_ENV,
    }

    if (!apiKey) {
      return res.status(400).json({
        ...info,
        success: false,
        error: "API key not configured",
        message: "Please set up the FIRECRAWL_API_KEY environment variable",
      })
    }

    // Test endpoints
    const endpoints = [
      "https://api.firecrawl.com/status",
      "https://api.firecrawl.dev/status",
      "https://api.firecrawl.io/status",
    ]

    const results = []

    // Test each endpoint
    for (const endpoint of endpoints) {
      const start = Date.now()
      try {
        console.log(`Testing connection to ${endpoint}...`)

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          // Set a timeout to avoid hanging
          signal: AbortSignal.timeout(5000),
        })

        const duration = Date.now() - start
        let responseText = ""

        try {
          responseText = await response.text()
        } catch (e) {
          responseText = "Failed to read response"
        }

        results.push({
          endpoint,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          response: responseText.substring(0, 200), // First 200 chars only
        })

        if (response.ok) {
          // We found a working endpoint, no need to try others
          break
        }
      } catch (error) {
        const duration = Date.now() - start
        results.push({
          endpoint,
          success: false,
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Find the first successful result, if any
    const successfulResult = results.find((r) => r.success)

    return res.status(200).json({
      ...info,
      success: !!successfulResult,
      results,
      workingEndpoint: successfulResult?.endpoint,
      message: successfulResult
        ? `Successfully connected to Firecrawl API at ${successfulResult.endpoint}`
        : "Failed to connect to any Firecrawl API endpoints",
    })
  } catch (error) {
    console.error("Firecrawl status check error:", error)
    return res.status(500).json({
      success: false,
      error: "Status check failed",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

