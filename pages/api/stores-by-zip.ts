import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

interface StorePrice {
  storeName: string
  address: string
  regularPrice: number | null
  organicPrice: number | null
  inStock: boolean
  distance: number // in miles
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zipCode } = req.query

    if (!zipCode || typeof zipCode !== "string") {
      return res.status(400).json({
        success: false,
        error: "ZIP code is required",
      })
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
    const stores: StorePrice[] = storeLocations.map((location) => {
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

    return res.status(200).json({
      success: true,
      stores: stores,
    })
  } catch (error) {
    console.error("Error fetching stores by ZIP:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch store data",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}

