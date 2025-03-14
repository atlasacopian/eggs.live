import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // This endpoint is for manual testing, so we'll add some basic auth
    const { key } = req.query

    if (key !== process.env.ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Invalid or missing admin key",
      })
    }

    console.log("Manual LA scrape initiated")

    // First, check if we can access the database
    try {
      const storeCount = await prisma.store.count()
      console.log(`Database connection successful. Found ${storeCount} stores.`)
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return res.status(500).json({
        success: false,
        error: "Database connection error",
        message: "Could not connect to database. Please check your database configuration.",
        details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      })
    }

    // Run the scraper
    const results = await scrapeAllStores()

    // Count successful scrapes
    const successCount = results.filter((r) => r.success && r.count > 0).length
    const totalAttempted = results.length

    return res.json({
      success: true,
      message: `Manual LA scrape completed. Successfully scraped ${successCount} out of ${totalAttempted} stores.`,
      date: new Date().toISOString(),
      scrapedCount: successCount,
      totalAttempted,
      results: results.map((r) => ({
        store: r.store,
        zipCode: r.zipCode,
        success: r.success,
        count: r.count,
        ...(r.error && { error: r.error }),
      })),
    })
  } catch (error) {
    console.error("Error in manual LA scrape:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to run LA scraping job",
      message: error.message || "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    })
  }
}

