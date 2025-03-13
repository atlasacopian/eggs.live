import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Tell Next.js this is a dynamic route
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get the current date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Query for today's prices
    const prices = await prisma.egg_prices.findMany({
      where: {
        date: {
          gte: today,
        },
        price: {
          gt: 0, // Ensure we only get valid prices
        },
      },
      include: {
        store: true,
      },
    })

    // Calculate average prices
    let regularTotal = 0
    let regularCount = 0
    let organicTotal = 0
    let organicCount = 0

    prices.forEach((price) => {
      if (price.eggType === "regular") {
        regularTotal += price.price
        regularCount++
      } else if (price.eggType === "organic") {
        organicTotal += price.price
        organicCount++
      }
    })

    const regularAverage = regularCount > 0 ? regularTotal / regularCount : 0
    const organicAverage = organicCount > 0 ? organicTotal / organicCount : 0

    return NextResponse.json({
      prices,
      averages: {
        regular: regularAverage,
        organic: organicAverage,
        regularCount,
        organicCount,
      },
    })
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 })
  }
}

