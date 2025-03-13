import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Check database connection
    const tables = []

    // Check store table
    try {
      const storeCount = await prisma.store.count()
      tables.push({ name: "store", count: storeCount, status: "ok" })
    } catch (error) {
      tables.push({ name: "store", error: error.message, status: "error" })
    }

    // Check store_locations table
    try {
      const locationCount = await prisma.store_locations.count()
      tables.push({ name: "store_locations", count: locationCount, status: "ok" })
    } catch (error) {
      tables.push({ name: "store_locations", error: error.message, status: "error" })
    }

    // Check la_egg_prices table
    try {
      const priceCount = await prisma.la_egg_prices.count()
      tables.push({ name: "la_egg_prices", count: priceCount, status: "ok" })
    } catch (error) {
      tables.push({ name: "la_egg_prices", error: error.message, status: "error" })
    }

    // Get database schema information if possible
    let schema = null
    try {
      // This is PostgreSQL specific - adjust if using a different database
      const schemaResult = await prisma.$queryRaw`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `
      schema = schemaResult
    } catch (error) {
      console.error("Error fetching schema:", error)
    }

    return NextResponse.json({
      success: true,
      tables,
      schema,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database check failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

