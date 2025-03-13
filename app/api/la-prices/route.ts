import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eggType = searchParams.get("eggType") || "regular"
    const zipCode = searchParams.get("zipCode")

    console.log(`Fetching LA prices for ${eggType} eggs${zipCode ? ` in ${zipCode}` : ""}`)

    // First, let's check if the database connection is working
    try {
      // Simple query to check database connection
      const storeCount = await prisma.store.count()
      console.log(`Database connection successful. Found ${storeCount} stores.`)
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection error",
          message: dbError.message || "Could not connect to database",
          details: JSON.stringify(dbError),
        },
        { status: 500 },
      )
    }

    // Get the current date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if the la_egg_prices table exists by trying a simple count query
    try {
      const priceCount = await prisma.la_egg_prices.count()
      console.log(`Found ${priceCount} total prices in la_egg_prices table`)
    } catch (tableError) {
      console.error("Error accessing la_egg_prices table:", tableError)
      return NextResponse.json(
        {
          success: false,
          error: "Table access error",
          message: "Could not access la_egg_prices table. It may not exist.",
          details: tableError.message,
        },
        { status: 500 },
      )
    }

    // Simplified query - just get prices without complex joins
    try {
      const prices = await prisma.la_egg_prices.findMany({
        where: {
          date: {
            gte: today,
          },
          eggType: eggType,
        },
        take: 100, // Limit to 100 results for safety
      })

      console.log(`Found ${prices.length} prices for ${eggType} eggs today`)

      // If no prices found, return empty data
      if (prices.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No prices found for today",
          eggType,
          laAverage: 0,
          chainAverages: [],
          priceCount: 0,
          prices: [],
          chains: [],
        })
      }

      // For now, return simplified data
      return NextResponse.json({
        success: true,
        eggType,
        priceCount: prices.length,
        prices: prices.map((p) => ({
          id: p.id,
          price: p.price,
          date: p.date,
          storeLocationId: p.store_location_id,
        })),
      })
    } catch (queryError) {
      console.error("Error querying prices:", queryError)
      return NextResponse.json(
        {
          success: false,
          error: "Query error",
          message: "Error querying prices",
          details: queryError.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in LA prices API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: error.message || "Unknown error occurred",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

