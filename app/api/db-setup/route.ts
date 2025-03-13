import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Check database tables
    const tables = []

    // Check store table
    try {
      const storeCount = await prisma.store.count()
      tables.push({ name: "store", exists: true, count: storeCount })
    } catch (error) {
      tables.push({ name: "store", exists: false, error: error.message })
    }

    // Check store_locations table
    try {
      const locationCount = await prisma.store_locations.count()
      tables.push({ name: "store_locations", exists: true, count: locationCount })
    } catch (error) {
      tables.push({ name: "store_locations", exists: false, error: error.message })
    }

    // Check la_egg_prices table
    try {
      const laPriceCount = await prisma.la_egg_prices.count()
      tables.push({ name: "la_egg_prices", exists: true, count: laPriceCount })
    } catch (error) {
      tables.push({ name: "la_egg_prices", exists: false, error: error.message })
    }

    // Check egg_prices table
    try {
      const priceCount = await prisma.egg_prices.count()
      tables.push({ name: "egg_prices", exists: true, count: priceCount })
    } catch (error) {
      tables.push({ name: "egg_prices", exists: false, error: error.message })
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

    return NextResponse.json({
      success: true,
      tables,
      schema,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database setup check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database setup check failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

