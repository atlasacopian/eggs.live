import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { eggType = "regular" } = req.query

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's prices
    const prices = await prisma.egg_prices.findMany({
      where: {
        date: {
          gte: today,
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
    })

    // Calculate national average
    let nationalAverage = 0
    const chainAverages = new Map()

    prices.forEach((price) => {
      const chainName = price.store_location.store.name
      if (!chainAverages.has(chainName)) {
        chainAverages.set(chainName, { sum: 0, count: 0 })
      }
      const chain = chainAverages.get(chainName)
      chain.sum += price.price
      chain.count += 1
    })

    if (prices.length > 0) {
      nationalAverage = prices.reduce((sum, p) => sum + p.price, 0) / prices.length
    }

    return res.json({
      success: true,
      eggType,
      nationalAverage,
      chainAverages: Array.from(chainAverages.entries()).map(([chain, data]) => ({
        chain,
        average: data.sum / data.count,
        count: data.count,
      })),
      priceCount: prices.length,
      prices: prices.map((p) => ({
        id: p.id,
        price: p.price,
        date: p.date,
        store: p.store_location.store.name,
        zipCode: p.store_location.zipCode,
      })),
    })
  } catch (error) {
    console.error("Error fetching prices:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch prices",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

