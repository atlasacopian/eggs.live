import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const hasFirecrawlKey = !!process.env.FIRECRAWL_API_KEY

    return res.json({
      success: true,
      config: {
        hasFirecrawlKey,
        environment: process.env.NODE_ENV,
        usingMockData: !hasFirecrawlKey,
      },
    })
  } catch (error) {
    console.error("Error checking scraper config:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to check scraper configuration",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

