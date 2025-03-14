import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { days = "7", storeId } = req.query

    // Convert days to number and validate
    const daysNum = Number.parseInt(days as string, 10)
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: "Invalid days parameter",
        message: "Days must be a number between 1 and 365",
      })
    }

    // Calculate date range
    const endDate = new Date()
    endDate.setHours(0, 0, 0, 0)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - daysNum)

    // Build query
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Add store filter if provided
    if (storeId) {
      where.store_location = {
        store_id: Number.parseInt(storeId as string, 10),
      }
    }

    // Get historical data
    const prices = await prisma.egg_prices.findMany({
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

    return res.json({
      success: true,
      days: daysNum,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      prices: prices.map((p) => ({
        id: p.id,
        date: p.date,
        price: p.price,
        eggType: p.eggType,
        store: p.store_location.store.name,
        zipCode: p.store_location.zipCode,
      })),
    })
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch historical data",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

