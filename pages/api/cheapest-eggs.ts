import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zipCode, includeOutOfStock = "false" } = req.query

    if (!zipCode || Array.isArray(zipCode)) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid zipCode parameter",
        message: "A valid 5-digit ZIP code is required",
      })
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zipCode)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ZIP code format",
        message: "ZIP code must be 5 digits",
      })
    }

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Base query conditions
    const baseWhere: any = {
      date: {
        gte: today,
      },
      price: {
        gt: 0, // Ensure we don't get zero prices
      },
    }

    // Add stock filter unless explicitly including out of stock items
    // Only add inStock filter if the column exists
    let hasInStockColumn = true
    try {
      // Try to query with inStock to see if the column exists
      await prisma.la_egg_prices.findFirst({
        where: { inStock: true },
        take: 1,
      })
    } catch (e) {
      // If this fails, the column doesn't exist yet
      hasInStockColumn = false
      console.log("inStock column does not exist yet, skipping filter")
    }

    if (hasInStockColumn && includeOutOfStock !== "true") {
      baseWhere["inStock"] = true
    }

    // Add zip code filter
    const locationFilter = {
      store_location: {
        zipCode: zipCode,
      },
    }

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
    const formatResults = (results: any[]) =>
      results.map((item) => ({
        price: item.price,
        storeName: item.store_location.store.name,
        address: item.store_location.address || `${item.store_location.store.name} (${item.store_location.zipCode})`,
        zipCode: item.store_location.zipCode,
        date: item.date,
        id: item.id,
        storeLocationId: item.store_location_id,
        inStock: hasInStockColumn ? item.inStock : true, // Default to true if column doesn't exist
      }))

    // Also get out of stock items if we're filtering them out
    let outOfStockItems = []
    if (hasInStockColumn && includeOutOfStock !== "true") {
      const outOfStock = await prisma.la_egg_prices.findMany({
        where: {
          date: {
            gte: today,
          },
          inStock: false,
          store_location: { zipCode },
        },
        include: {
          store_location: {
            include: {
              store: true,
            },
          },
        },
        take: 10, // Limit to 10 out of stock items
      })

      outOfStockItems = formatResults(outOfStock)
    }

    return res.json({
      success: true,
      zipCode,
      date: today.toISOString(),
      cheapestRegular: formatResults(cheapestRegular),
      cheapestOrganic: formatResults(cheapestOrganic),
      outOfStock: outOfStockItems,
      showingOutOfStock: includeOutOfStock === "true",
      hasInStockColumn,
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

