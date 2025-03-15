import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Try to query the database
    const storeCount = await prisma.store.count()
    const locationCount = await prisma.store_locations.count()
    const priceCount = await prisma.la_egg_prices.count()

    return res.status(200).json({
      success: true,
      message: "Database connection successful",
      counts: {
        stores: storeCount,
        locations: locationCount,
        prices: priceCount,
      },
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return res.status(500).json({
      success: false,
      error: "Database connection failed",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

