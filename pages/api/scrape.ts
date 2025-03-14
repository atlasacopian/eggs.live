import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Basic auth check
    const { key } = req.query
    if (key !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Invalid or missing admin key",
      })
    }

    // Check database connection
    try {
      const storeCount = await prisma.store.count()
      console.log(`Database connection successful. Found ${storeCount} stores.`)
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        error: "Database connection error",
        message: "Could not connect to database",
        details: process.env.NODE_ENV === "development" ? dbError : undefined,
      })
    }

    // Run scraper
    const results = await scrapeAllStores()

    return res.json({
      success: true,
      message: "Scraping completed",
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Scraping error:", error)
    return res.status(500).json({
      success: false,
      error: "Scraping failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

