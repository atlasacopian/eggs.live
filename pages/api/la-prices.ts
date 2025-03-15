import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zipCode, eggType = "regular" } = req.query

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Base query conditions
    const where: any = {
      date: {
        gte: today,
      },
      eggType: Array.isArray(eggType) ? eggType[0] : eggType,
    }

    // Add zip code filter if provided
    if (zipCode) {
      where.store_location = {
        zipcode: Array.isArray(zipCode) ? zipCode[0] : zipCode,
      }
    }

    // Get LA prices
    const prices = await prisma.la_egg_prices.findMany({
      where,
      include: {
        store_location: {
          include: {
            store: true,
          },
        },
      },
      orderBy: {
        price: "asc",
      },
    })

    // Group by store
    const storeGroups = prices.reduce((groups: Record<string, any[]>, price) => {
      const storeId = price.store_location.store.id
      if (!groups[storeId]) {
        groups[storeId] = []
      }
      groups[storeId].push(price)
      return groups
    }, {})

    // Format the results
    const formattedPrices = Object.entries(storeGroups).map(([storeId, prices]) => {
      const firstPrice = prices[0]
      return {
        storeId: parseInt(storeId),
        storeName: firstPrice.store_location.store.name,
        address: firstPrice.store_location.address || "Address not available",
        zipCode: firstPrice.store_location.zipcode, // Changed from zipCode to zipcode
        latitude: firstPrice.store_location.latitude,
        longitude: firstPrice.store_location.longitude,
        prices: prices.map((p) => ({
          id: p.id,
          price: p.price,
          eggType: p.eggType,
          date: p.date,
          inStock: p.inStock,
        })),
      }
    })

    return res.json({
      success: true,
      count: formattedPrices.length,
      prices: formattedPrices,
    })
  } catch (error) {
    console.error("Error getting LA prices:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to get LA prices",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
