import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eggType = searchParams.get("eggType") || "regular"
    const zipCode = searchParams.get("zipCode")

    // Get the current date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Base query conditions
    const whereConditions: any = {
      date: {
        gte: today,
      },
      price: {
        gt: 0, // Ensure we only get valid prices
      },
      eggType: eggType,
    }

    // Add zip code filter if specified
    if (zipCode) {
      whereConditions.store_location = {
        zipCode: zipCode,
      }
    }

    // Query for today's LA prices
    const prices = await prisma.la_egg_prices.findMany({
      where: whereConditions,
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

    // Group stores by chain
    const chainGroups: Record<string, any[]> = {}
    prices.forEach((price) => {
      const chainName = price.store_location.store.name
      if (!chainGroups[chainName]) {
        chainGroups[chainName] = []
      }

      chainGroups[chainName].push({
        id: price.id,
        storeName: price.store_location.store.name,
        zipCode: price.store_location.zipCode,
        address: price.store_location.address,
        price: price.price,
        date: price.date.toISOString(),
      })
    })

    // Calculate average price per chain
    const chainAverages = Object.entries(chainGroups)
      .map(([chain, stores]) => {
        const total = stores.reduce((sum, store) => sum + store.price, 0)
        const avg = stores.length > 0 ? total / stores.length : 0
        return {
          chain,
          avgPrice: avg,
          storeCount: stores.length,
          lowestPrice: stores.length > 0 ? stores[0].price : 0, // Already sorted by price
        }
      })
      .sort((a, b) => a.avgPrice - b.avgPrice)

    // Calculate LA average
    const laTotal = prices.reduce((sum, price) => sum + price.price, 0)
    const laAvg = prices.length > 0 ? laTotal / prices.length : 0

    // Format the response
    const formattedPrices = prices.map((price) => ({
      id: price.id,
      store: price.store_location.store.name,
      zipCode: price.store_location.zipCode,
      address: price.store_location.address,
      price: price.price,
      date: price.date.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      eggType,
      laAverage: laAvg,
      chainAverages,
      priceCount: prices.length,
      prices: formattedPrices,
      chains: Object.keys(chainGroups),
    })
  } catch (error) {
    console.error("Error fetching LA prices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch LA prices",
      },
      { status: 500 },
    )
  }
}

