import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eggType = searchParams.get("eggType") || "regular" // Default to regular eggs

  try {
    // Get all stores with their latest prices
    const stores = await prisma.store.findMany()

    // For each store, get the latest price and the previous day's price for the specified egg type
    const storesWithPrices = await Promise.all(
      stores.map(async (store) => {
        // Get the latest price for the specified egg type
        const latestPrice = await prisma.eggPrice.findFirst({
          where: {
            storeId: store.id,
            eggType: eggType,
          },
          orderBy: { date: "desc" },
        })

        // Get the previous day's price
        const previousDate = new Date(latestPrice?.date || new Date())
        previousDate.setDate(previousDate.getDate() - 1)

        const previousPrice = await prisma.eggPrice.findFirst({
          where: {
            storeId: store.id,
            eggType: eggType,
            date: {
              lt: latestPrice?.date || new Date(),
              gte: previousDate,
            },
          },
          orderBy: { date: "desc" },
        })

        // Calculate change
        const currentPrice = latestPrice?.price || 0
        const prevPrice = previousPrice?.price || currentPrice
        const change = currentPrice - prevPrice
        const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0

        return {
          id: store.id,
          name: store.name,
          price: currentPrice,
          change,
          changePercent,
          lastUpdated: latestPrice?.date || new Date(),
        }
      }),
    )

    return NextResponse.json(storesWithPrices)
  } catch (error) {
    console.error("Error fetching store data:", error)
    return NextResponse.json({ error: "Failed to fetch store data" }, { status: 500 })
  }
}

