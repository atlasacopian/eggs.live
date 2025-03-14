import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check database tables
    const tables = []

    // Check store table
    try {
      const storeCount = await prisma.store.count()
      tables.push({ name: "store", exists: true, count: storeCount })
    } catch (error) {
      tables.push({ name: "store", exists: false, error: error instanceof Error ? error.message : "Unknown error" })
    }

    // Check store_locations table
    try {
      const locationCount = await prisma.store_locations.count()
      tables.push({ name: "store_locations", exists: true, count: locationCount })
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
      tables.push({ name: "la_egg_prices", exists: true, count: laPriceCount })
    } catch (error) {
      tables.push({
        name: "la_egg_prices",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Check egg_prices table
    try {
      const priceCount = await prisma.egg_prices.count()
      tables.push({ name: "egg_prices", exists: true, count: priceCount })
    } catch (error) {
      tables.push({
        name: "egg_prices",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Get database schema information
    let schema = null
    try {
      schema = await prisma.$queryRaw`
        SELECT table_name, column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `
    } catch (error) {
      console.error("Error fetching schema:", error)
    }

    return res.json({
      success: true,
      tables,
      schema,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database setup check error:", error)
    return res.status(500).json({
      success: false,
      error: "Database setup check failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

