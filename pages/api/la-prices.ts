import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { eggType = "regular", zipCode } = req.query

    console.log(`Fetching LA prices for ${eggType} eggs${zipCode ? ` in ${zipCode}` : ""}`)

    // Get the current date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Build the query
    const where: any = {
      date: {
        gte: today,
      },
      eggType: eggType as string,
    }

    if (zipCode) {
      where.store_location = {
        zipCode: zipCode as string,
      }
    }

    // Get today's prices
    const prices = await prisma.la_egg_prices.findMany({
      where,
      include: {
        store_location: {
          include: {
            store: true,
          },
        },
      },
      take: 100, // Limit results for safety
    })

    // Calculate averages
    let laAverage = 0
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
      laAverage = prices.reduce((sum, p) => sum + p.price, 0) / prices.length
    }

    return res.json({
      success: true,
      eggType,
      laAverage,
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
        address: p.store_location.address,
        zipCode: p.store_location.zipCode,
      })),
    })
  } catch (error) {
    console.error("Error fetching LA prices:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch LA prices",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

