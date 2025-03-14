import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { days = "30", eggType = "regular" } = req.query

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

    // Get historical prices
    const prices = await prisma.egg_prices.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        eggType: eggType as string,
      },
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

    // Calculate daily averages
    const dailyAverages = new Map()
    prices.forEach((price) => {
      const dateStr = price.date.toISOString().split("T")[0]
      if (!dailyAverages.has(dateStr)) {
        dailyAverages.set(dateStr, { sum: 0, count: 0 })
      }
      const daily = dailyAverages.get(dateStr)
      daily.sum += price.price
      daily.count += 1
    })

    const averages = Array.from(dailyAverages.entries()).map(([date, data]) => ({
      date,
      average: data.sum / data.count,
      count: data.count,
    }))

    return res.json({
      success: true,
      eggType,
      days: daysNum,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      averages,
      prices: prices.map((p) => ({
        id: p.id,
        date: p.date,
        price: p.price,
        store: p.store_location.store.name,
        zipCode: p.store_location.zipCode,
      })),
    })
  } catch (error) {
    console.error("Error fetching historical prices:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch historical prices",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

