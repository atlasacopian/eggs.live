import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface Location {
  latitude: number
  longitude: number
}

// Function to calculate distance between two points using Haversine formula
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 3959 // Earth's radius in miles
  const lat1 = (loc1.latitude * Math.PI) / 180
  const lat2 = (loc2.latitude * Math.PI) / 180
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const zipCode = searchParams.get("zipCode")

    if (!zipCode) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find stores in the given zip code and nearby areas
    const storeLocations = await prisma.store_locations.findMany({
      where: {
        zipCode: zipCode,
      },
      include: {
        store: true,
        la_egg_prices: {
          where: {
            date: {
              gte: today,
            },
          },
        },
      },
    })

    // Format the results
    const stores = storeLocations.map((location) => {
      const regularPrice = location.la_egg_prices.find((p) => p.eggType === "regular")?.price || null
      const organicPrice = location.la_egg_prices.find((p) => p.eggType === "organic")?.price || null

      // Consider in stock if we have at least one price
      const inStock = regularPrice !== null || organicPrice !== null

      return {
        storeName: location.store.name,
        address: location.address || "Address not available",
        regularPrice,
        organicPrice,
        inStock,
        distance: 0, // Same zip code = 0 miles
      }
    })

    return NextResponse.json({
      success: true,
      stores: stores,
    })
  } catch (error) {
    console.error("Error fetching stores by ZIP:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch store data",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

