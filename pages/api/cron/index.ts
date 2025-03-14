import type { NextApiRequest, NextApiResponse } from "next"
import { scrapeAllStores } from "@/lib/scrapers/daily-scraping"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = req.headers.authorization
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // Check if this is a full scrape request
    const { full = false } = req.query
    console.log(`LA scrape cron job initiated (${full ? "full" : "regular"})`)

    const results = await scrapeAllStores(full === "true")

    // Count successful scrapes
    const successCount = results.filter((r) => r.success && r.count > 0).length

    return res.json({
      success: true,
      message: `${full ? "Full" : "Regular"} LA scrape completed`,
      date: new Date().toISOString(),
      scrapedCount: successCount,
      totalAttempted: results.length,
    })
  } catch (error) {
    console.error("Error in LA scrape cron job:", error)
    return res.status(500).json({
      error: "Failed to run LA scraping job",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

