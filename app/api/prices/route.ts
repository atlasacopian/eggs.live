import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get("timeframe") || "1M"
  const eggType = searchParams.get("eggType") || "regular" // Default to regular eggs

  try {
    // Calculate date range based on timeframe
    const endDate = new Date()
    let startDate = new Date()

    switch (timeframe) {
      case "1W":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "1M":
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case "3M":
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case "6M":
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case "1Y":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      case "ALL":
        startDate = new Date(0) // Beginning of time
        break
      default:
        startDate.setMonth(endDate.getMonth() - 1)
    }

    // Get average prices for the date range and egg type
    const averagePrices = await prisma.averagePrice.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        eggType: eggType,
      },
      orderBy: {
        date: "asc",
      },
    })

    // Get the latest average price for current price display
    const latestPrice = await prisma.averagePrice.findFirst({
      where: {
        eggType: eggType,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json({
      prices: averagePrices.map((price) => ({
        date: price.date.toISOString(),
        price: price.price,
      })),
      currentPrice: latestPrice ? latestPrice.price : null,
      lastUpdated: latestPrice ? latestPrice.date.toISOString() : null,
    })
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
}

