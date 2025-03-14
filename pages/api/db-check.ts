import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Create a new Prisma client for this request
    const prisma = new PrismaClient()

    // Check database tables
    const tables = []

    try {
      // Check store table
      const storeCount = await prisma.store.count()
      tables.push({ name: "store", exists: true, count: storeCount })

      // Check store_locations table
      const locationCount = await prisma.store_locations.count()
      tables.push({ name: "store_locations", exists: true, count: locationCount })

      // Check la_egg_prices table
      const laPriceCount = await prisma.la_egg_prices.count()
      tables.push({ name: "la_egg_prices", exists: true, count: laPriceCount })

      // Check egg_prices table
      const priceCount = await prisma.egg_prices.count()
      tables.push({ name: "egg_prices", exists: true, count: priceCount })

      // Get database schema information
      const schema = await prisma.$queryRaw`
        SELECT table_name, column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `

      // Disconnect the client
      await prisma.$disconnect()

      return res.json({
        success: true,
        tables,
        schema,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      // Make sure to disconnect on error
      await prisma.$disconnect()
      throw error
    }
  } catch (error) {
    console.error("Database check error:", error)
    return res.status(500).json({
      success: false,
      error: "Database check failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

