import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zipCode, storeId, days = "30", eggType = "regular" } = req.query

    // Validate parameters
    if ((!zipCode && !storeId) || (zipCode && Array.isArray(zipCode)) || (storeId && Array.isArray(storeId))) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid parameters",
        message: "Either zipCode or storeId must be provided",
      })
    }

    // Parse days parameter
    const daysToLookBack = Number.parseInt(Array.isArray(days) ? days[0] : days, 10) || 30
    if (daysToLookBack <= 0 || daysToLookBack > 365) {
      return res.status(400).json({
        success: false,
        error: "Invalid days parameter",
        message: "Days must be between 1 and 365",
      })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysToLookBack)

    // Build where clause
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      eggType: Array.isArray(eggType) ? eggType[0] : eggType,
    }

    // Add location filter
    if (zipCode) {
      where.store_location = {
        zipcode: zipCode as string,
      }
    } else if (storeId) {
      where.store_location = {
        store_id: Number.parseInt(storeId as string, 10),
      }
    }

    // Get historical prices
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
        date: "asc",
      },
    })

    // Format the results
    const formattedPrices = prices.map((item) => ({
      id: item.id,
      price: item.price,
      date: item.date,
      storeName: item.store_location.store.name,
      address: item.store_location.address || "Address not available",
      zipCode: item.store_location.zipcode,
      eggType: item.eggType,
      inStock: item.inStock,
    }))

    // Group by date for chart data
    const dateGroups = formattedPrices.reduce((groups: Record<string, any[]>, item) => {
      const dateStr = item.date.toISOString().split("T")[0]
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(item)
      return groups
    }, {})

    // Calculate average price per date
    const chartData = Object.entries(dateGroups).map(([date, items]) => {
      const sum = items.reduce((total, item) => total + item.price, 0)
      const avg = sum / items.length
      return {
        date,
        avgPrice: Number.parseFloat(avg.toFixed(2)),
        count: items.length,
      }
    })

    return res.json({
      success: true,
      query: {
        zipCode: zipCode || null,
        storeId: storeId || null,
        days: daysToLookBack,
        eggType,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
      prices: formattedPrices,
      chartData,
    })
  } catch (error) {
    console.error("Error getting historical prices:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to get historical prices",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

