import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zipCode, includeOutOfStock = "false" } = req.query

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Base query conditions for prices
    const baseWhere: any = {
      date: {
        gte: today,
      },
      price: {
        gt: 0,
      },
      store_location: {
        zipcode: zipCode as string,
      },
    }

    if (includeOutOfStock !== "true") {
      baseWhere["inStock"] = true
    }

    // Find cheapest regular eggs
    const cheapestRegular = await prisma.la_egg_prices.findMany({
      where: {
        ...baseWhere,
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
      take: 5,
    })

    // Find cheapest organic eggs
    const cheapestOrganic = await prisma.la_egg_prices.findMany({
      where: {
        ...baseWhere,
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
      take: 5,
    })

    // Format the results
    const formatResults = (results: any[]) =>
      results.map((item) => ({
        price: item.price,
        storeName: item.store_location.store.name,
        address: item.store_location.address || "Address not available",
        zipCode: item.store_location.zipcode,
        date: item.date,
        id: item.id,
        storeLocationId: item.store_location_id,
        inStock: item.inStock,
      }))

    // Get out of stock items
    let outOfStockItems = []
    if (includeOutOfStock !== "true" && cheapestRegular.length === 0 && cheapestOrganic.length === 0) {
      const outOfStock = await prisma.la_egg_prices.findMany({
        where: {
          store_location: {
            zipcode: zipCode as string,
          },
          date: {
            gte: today,
          },
          inStock: false,
        },
        include: {
          store_location: {
            include: {
              store: true,
            },
          },
        },
        take: 10,
      })

      outOfStockItems = formatResults(outOfStock)
    }

    return res.json({
      success: true,
      zipCode: zipCode || "all",
      date: today.toISOString(),
      cheapestRegular: formatResults(cheapestRegular),
      cheapestOrganic: formatResults(cheapestOrganic),
      outOfStock: outOfStockItems,
      showingOutOfStock: includeOutOfStock === "true",
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

