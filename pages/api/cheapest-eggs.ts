import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zipCode } = req.query

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Base query conditions
    const baseWhere = {
      date: {
        gte: today,
      },
      price: {
        gt: 0, // Ensure we don't get zero prices
      },
    }

    // Add zip code filter if provided
    const locationFilter = zipCode
      ? {
          store_location: {
            zipCode: zipCode as string,
          },
        }
      : {}

    // Find cheapest regular eggs
    const cheapestRegular = await prisma.la_egg_prices.findMany({
      where: {
        ...baseWhere,
        ...locationFilter,
        eggType: "regular",
      },
      orderBy: {
        price: "asc",
      },
      include: {
        store_location: {
          include: {
            store: true,
          },
        },
      },
      take: 5, // Get top 5 cheapest
    })

    // Find cheapest organic eggs
    const cheapestOrganic = await prisma.la_egg_prices.findMany({
      where: {
        ...baseWhere,
        ...locationFilter,
        eggType: "organic",
      },
      orderBy: {
        price: "asc",
      },
      include: {
        store_location: {
          include: {
            store: true,
          },
        },
      },
      take: 5, // Get top 5 cheapest
    })

    // Format the results
    const formatResults = (results) =>
      results.map((item) => ({
        price: item.price,
        storeName: item.store_location.store.name,
        address: item.store_location.address || "Address not available",
        zipCode: item.store_location.zipCode,
        date: item.date,
        id: item.id,
        storeLocationId: item.store_location_id,
      }))

    return res.json({
      success: true,
      zipCode: zipCode || "all",
      date: today.toISOString(),
      cheapestRegular: formatResults(cheapestRegular),
      cheapestOrganic: formatResults(cheapestOrganic),
    })
  } catch (error) {
    console.error("Error finding cheapest eggs:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to find cheapest eggs",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

