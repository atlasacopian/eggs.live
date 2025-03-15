import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY

    // Check if the API key is configured
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "Firecrawl API key not configured",
        message: "Please set up the FIRECRAWL_API_KEY environment variable",
      })
    }

    // Try to make a simple request to Firecrawl to verify the API key
    try {
      const response = await fetch("https://api.firecrawl.com/status", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return res.status(response.status).json({
          success: false,
          error: "Firecrawl API key validation failed",
          message: errorText,
          status: response.status,
        })
      }

      const data = await response.json()

      return res.status(200).json({
        success: true,
        message: "Firecrawl API key is valid",
        apiKeyPrefix: apiKey.substring(0, 5) + "...",
        firecrawlStatus: data,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to validate Firecrawl API key",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  } catch (error) {
    console.error("Error checking Firecrawl:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to check Firecrawl configuration",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

