import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test each table with a simple query
    const tables = []

    // Check store table
    try {
      const storeCount = await prisma.store.count()
      tables.push({
        name: "store",
        exists: true,
        count: storeCount,
        columns: await getTableColumns("store"),
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
        columns: await getTableColumns("store_locations"),
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
      const priceCount = await prisma.la_egg_prices.count()
      tables.push({
        name: "la_egg_prices",
        exists: true,
        count: priceCount,
        columns: await getTableColumns("la_egg_prices"),
      })
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
      tables.push({
        name: "egg_prices",
        exists: true,
        count: priceCount,
        columns: await getTableColumns("egg_prices"),
      })
    } catch (error) {
      tables.push({
        name: "egg_prices",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    return res.json({
      success: true,
      tables,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Schema verification error:", error)
    return res.status(500).json({
      success: false,
      error: "Schema verification failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

async function getTableColumns(tableName: string) {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = ${tableName}
    ORDER BY ordinal_position;
  `
  return result
}

