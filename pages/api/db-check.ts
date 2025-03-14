import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check database tables
    const tables = []

    // Check each table
    const tableChecks = [
      { name: "store", query: () => prisma.store.count() },
      { name: "store_locations", query: () => prisma.store_locations.count() },
      { name: "la_egg_prices", query: () => prisma.la_egg_prices.count() },
      { name: "egg_prices", query: () => prisma.egg_prices.count() },
    ]

    for (const check of tableChecks) {
      try {
        const count = await check.query()
        tables.push({ name: check.name, exists: true, count })
      } catch (error) {
        tables.push({
          name: check.name,
          exists: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
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

    // Get table constraints
    let constraints = null
    try {
      constraints = await prisma.$queryRaw`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type,
          kcu.column_name
        FROM 
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        WHERE 
          tc.table_schema = 'public'
        ORDER BY 
          tc.table_name, 
          tc.constraint_name
      `
    } catch (error) {
      console.error("Error fetching constraints:", error)
    }

    return res.json({
      success: true,
      tables,
      schema,
      constraints,
      timestamp: new Date().toISOString(),
    })
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

