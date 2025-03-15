import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

type TableStatus = {
  name: string
  exists: boolean
  count?: number
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const tables: TableStatus[] = []

  try {
    // Check store table
    try {
      const storeCount = await prisma.store.count()
      tables.push({
        name: "store",
        exists: true,
        count: storeCount,
      })
    } catch (error) {
      tables.push({
        name: "store",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Check store_locations table
    try {
      const locationCount = await prisma.store_locations.count()
      tables.push({
        name: "store_locations",
        exists: true,
        count: locationCount,
      })
    } catch (error) {
      tables.push({
        name: "store_locations",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Check la_egg_prices table
    try {
      const laPriceCount = await prisma.la_egg_prices.count()
      tables.push({
        name: "la_egg_prices",
        exists: true,
        count: laPriceCount,
      })
    } catch (error) {
      tables.push({
        name: "la_egg_prices",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Check egg_prices table (now using la_egg_prices instead)
    try {
      const priceCount = await prisma.la_egg_prices.count()
      tables.push({
        name: "egg_prices",
        exists: true,
        count: priceCount,
        error: "Note: Using la_egg_prices table instead of egg_prices",
      })
    } catch (error) {
      tables.push({
        name: "egg_prices",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    return res.status(200).json({
      success: true,
      tables,
      message: "Schema verification complete",
    })
  } catch (error) {
    console.error("Error verifying schema:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to verify schema",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  } finally {
    await prisma.$disconnect()
  }
}

