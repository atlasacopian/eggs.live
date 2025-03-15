import type { NextApiRequest, NextApiResponse } from 'next'
import { scrapeAllStores } from '@/lib/scrapers/daily-scraping'
import { PrismaClient } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const prisma = new PrismaClient()

  try {
    // First, check if we have the required API key
    if (!process.env.FIRECRAWL_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Firecrawl API key not configured',
        message: 'Please set up the FIRECRAWL_API_KEY environment variable',
      })
    }

    // Run the scraper
    console.log('Starting initial scrape...')
    const results = await scrapeAllStores(true) // true means scrape all stores, not just a sample

    return res.json({
      success: true,
      message: 'Initial scrape completed',
      results,
    })
  } catch (error) {
    console.error('Error during initial scrape:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to run initial scrape',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    await prisma.$disconnect()
  }
}
